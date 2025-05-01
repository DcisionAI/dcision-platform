-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";

-- Create function to update updated_at timestamp if it doesn't exist
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

do $$
declare
    location_exists boolean;
begin
    -- Check if locations table exists and has required columns
    select exists (
        select 1 from information_schema.tables 
        where table_schema = 'public' 
        and table_name = 'locations'
    ) into location_exists;

    if not location_exists then
        -- Create locations table if it doesn't exist
        create table public.locations (
            id uuid default uuid_generate_v4() primary key,
            name text not null,
            address text,
            coordinates geometry(Point, 4326),
            type text not null check (type in ('pickup', 'delivery', 'depot')),
            capacity_m3 decimal(10,2),
            operating_hours jsonb,
            created_at timestamptz default now(),
            updated_at timestamptz default now()
        );

        -- Add spatial index for locations
        create index locations_coordinates_idx on public.locations using gist(coordinates);
        
        raise notice 'Created locations table';
    else
        raise notice 'Locations table already exists';
    end if;

    -- Drop and recreate dependent tables
    drop table if exists public.vehicle_assignments cascade;
    drop table if exists public.delivery_requests cascade;

    -- Create delivery_requests table
    create table public.delivery_requests (
        id uuid default uuid_generate_v4() primary key,
        pickup_location_id uuid not null,
        delivery_location_id uuid not null,
        time_window_id uuid references public.time_windows(id),
        status text not null check (status in ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
        priority integer default 1 check (priority between 1 and 5),
        demand_volume_m3 decimal(10,2),
        demand_weight_kg decimal(10,2),
        created_at timestamptz default now(),
        updated_at timestamptz default now(),
        constraint fk_pickup_location foreign key (pickup_location_id) references public.locations(id),
        constraint fk_delivery_location foreign key (delivery_location_id) references public.locations(id)
    );

    -- Add indexes for delivery_requests
    create index delivery_requests_pickup_location_idx on public.delivery_requests(pickup_location_id);
    create index delivery_requests_delivery_location_idx on public.delivery_requests(delivery_location_id);
    create index delivery_requests_time_window_idx on public.delivery_requests(time_window_id);
    create index delivery_requests_status_idx on public.delivery_requests(status);

    -- Create vehicle_assignments table
    create table public.vehicle_assignments (
        id uuid default uuid_generate_v4() primary key,
        vehicle_id uuid references public.vehicles(id) not null,
        delivery_request_id uuid references public.delivery_requests(id) not null,
        driver_id uuid references public.drivers(id),
        assigned_at timestamptz default now(),
        planned_start_time timestamptz,
        planned_end_time timestamptz,
        actual_start_time timestamptz,
        actual_end_time timestamptz,
        status text not null check (status in ('planned', 'in_progress', 'completed', 'cancelled')),
        created_at timestamptz default now(),
        updated_at timestamptz default now()
    );

    -- Add unique constraint for active assignments
    create unique index vehicle_assignments_active_unique_idx 
    on public.vehicle_assignments(delivery_request_id, status) 
    where status in ('planned', 'in_progress');

    -- Add indexes for vehicle_assignments
    create index vehicle_assignments_vehicle_idx on public.vehicle_assignments(vehicle_id);
    create index vehicle_assignments_delivery_request_idx on public.vehicle_assignments(delivery_request_id);
    create index vehicle_assignments_driver_idx on public.vehicle_assignments(driver_id);
    create index vehicle_assignments_status_idx on public.vehicle_assignments(status);

    raise notice 'All tables created successfully';

exception when others then
    raise notice 'Error during table creation: % %', SQLERRM, SQLSTATE;
    raise exception '%', SQLERRM;
end;
$$;

-- Enable RLS for all tables
alter table if exists public.locations enable row level security;
alter table public.delivery_requests enable row level security;
alter table public.vehicle_assignments enable row level security;

-- Add RLS policies for locations if they don't exist
do $$
begin
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'locations' and policyname = 'Locations viewable by authenticated users') then
        create policy "Locations viewable by authenticated users"
            on public.locations for select
            using (auth.role() = 'authenticated');
    end if;

    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'locations' and policyname = 'Locations modifiable by admins') then
        create policy "Locations modifiable by admins"
            on public.locations for all
            using (auth.role() = 'authenticated' and auth.uid() in (
                select id from auth.users where raw_user_meta_data->>'role' = 'admin'
            ));
    end if;
end;
$$;

-- Add RLS policies for delivery_requests
create policy "Delivery requests viewable by authenticated users"
    on public.delivery_requests for select
    using (auth.role() = 'authenticated');

create policy "Delivery requests modifiable by admins"
    on public.delivery_requests for all
    using (auth.role() = 'authenticated' and auth.uid() in (
        select id from auth.users where raw_user_meta_data->>'role' = 'admin'
    ));

-- Add RLS policies for vehicle_assignments
create policy "Vehicle assignments viewable by authenticated users"
    on public.vehicle_assignments for select
    using (auth.role() = 'authenticated');

create policy "Vehicle assignments modifiable by admins"
    on public.vehicle_assignments for all
    using (auth.role() = 'authenticated' and auth.uid() in (
        select id from auth.users where raw_user_meta_data->>'role' = 'admin'
    ));

-- Add triggers for updated_at if they don't exist
do $$
begin
    if not exists (select 1 from pg_trigger where tgname = 'update_locations_updated_at') then
        create trigger update_locations_updated_at
            before update on public.locations
            for each row execute procedure public.update_updated_at_column();
    end if;

    create trigger update_delivery_requests_updated_at
        before update on public.delivery_requests
        for each row execute procedure public.update_updated_at_column();

    create trigger update_vehicle_assignments_updated_at
        before update on public.vehicle_assignments
        for each row execute procedure public.update_updated_at_column();
end;
$$;

-- Add functions to help with vehicle routing
create or replace function public.get_available_vehicles(
    required_capacity_m3 decimal,
    required_weight_kg decimal,
    pickup_time timestamptz
) returns setof public.vehicles as $$
begin
    return query
    select v.*
    from public.vehicles v
    where v.status = 'available'
    and v.capacity_m3 >= required_capacity_m3
    and v.max_weight_kg >= required_weight_kg
    and not exists (
        select 1
        from public.vehicle_assignments va
        where va.vehicle_id = v.id
        and va.status in ('planned', 'in_progress')
        and (
            pickup_time between va.planned_start_time and va.planned_end_time
            or va.planned_start_time between pickup_time and pickup_time + interval '2 hours'
        )
    );
end;
$$ language plpgsql security definer; 