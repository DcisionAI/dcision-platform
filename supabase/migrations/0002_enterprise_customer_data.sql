-- Enable PostGIS for location data
create extension if not exists postgis;

-- Drop existing tables in reverse order of dependencies
drop table if exists public.time_windows cascade;
drop table if exists public.drivers cascade;
drop table if exists public.vehicles cascade;
drop table if exists public.locations cascade;
drop table if exists public.order_items cascade;
drop table if exists public.orders cascade;
drop table if exists public.products cascade;
drop table if exists public.customers cascade;

-- Create tables
create table if not exists public.customers (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    industry text,
    location geography(point, 4326),
    address text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists public.orders (
    id uuid default uuid_generate_v4() primary key,
    customer_id uuid references public.customers(id),
    order_date timestamptz not null,
    delivery_date timestamptz not null,
    status text not null check (status in ('pending', 'processing', 'delivered', 'cancelled')),
    priority text not null check (priority in ('low', 'medium', 'high')),
    total_value decimal(10,2) not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists public.products (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    description text,
    unit_price decimal(10,2) not null,
    weight_kg decimal(10,2),
    volume_m3 decimal(10,2),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists public.order_items (
    id uuid default uuid_generate_v4() primary key,
    order_id uuid references public.orders(id),
    product_id uuid references public.products(id),
    quantity integer not null,
    unit_price decimal(10,2) not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists public.locations (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    address text,
    coordinates geography(point, 4326),
    type text not null check (type in ('warehouse', 'store', 'distribution_center')),
    capacity_m3 decimal(10,2),
    operating_hours jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists public.vehicles (
    id uuid default uuid_generate_v4() primary key,
    type text not null check (type in ('truck', 'van', 'motorcycle')),
    capacity_m3 decimal(10,2) not null,
    max_weight_kg decimal(10,2) not null,
    status text not null check (status in ('available', 'in_use', 'maintenance')),
    current_location_id uuid references public.locations(id),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists public.drivers (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    license text not null,
    status text not null check (status in ('available', 'on_duty', 'off_duty')),
    vehicle_id uuid references public.vehicles(id) on delete set null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists public.time_windows (
    id uuid default uuid_generate_v4() primary key,
    location_id uuid references public.locations(id),
    day_of_week integer not null check (day_of_week between 0 and 6),
    start_time time not null,
    end_time time not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Enable RLS for all tables
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.products enable row level security;
alter table public.order_items enable row level security;
alter table public.locations enable row level security;
alter table public.vehicles enable row level security;
alter table public.drivers enable row level security;
alter table public.time_windows enable row level security;

-- Create triggers for updated_at
create or replace function update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger update_customers_updated_at
    before update on public.customers
    for each row execute procedure update_updated_at_column();

create trigger update_orders_updated_at
    before update on public.orders
    for each row execute procedure update_updated_at_column();

create trigger update_products_updated_at
    before update on public.products
    for each row execute procedure update_updated_at_column();

create trigger update_order_items_updated_at
    before update on public.order_items
    for each row execute procedure update_updated_at_column();

create trigger update_locations_updated_at
    before update on public.locations
    for each row execute procedure update_updated_at_column();

create trigger update_vehicles_updated_at
    before update on public.vehicles
    for each row execute procedure update_updated_at_column();

create trigger update_drivers_updated_at
    before update on public.drivers
    for each row execute procedure update_updated_at_column();

create trigger update_time_windows_updated_at
    before update on public.time_windows
    for each row execute procedure update_updated_at_column();

-- Sample data
insert into public.products (name, description, unit_price, weight_kg, volume_m3) values
    ('Standard Box', 'Standard shipping box', 5.00, 1.0, 0.05),
    ('Large Box', 'Large shipping box', 8.00, 2.0, 0.1),
    ('Pallet', 'Standard pallet', 20.00, 20.0, 1.0),
    ('Bulk Container', 'Large bulk container', 50.00, 100.0, 2.0);

insert into public.locations (name, address, coordinates, type, capacity_m3, operating_hours) values
    ('Main Warehouse', '123 Industrial Ave, New York, NY', ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326), 'warehouse', 1000.0, 
     '{"monday": {"start": "08:00", "end": "18:00"}, "tuesday": {"start": "08:00", "end": "18:00"}, "wednesday": {"start": "08:00", "end": "18:00"}}'),
    ('Downtown Distribution Center', '456 Business St, New York, NY', ST_SetSRID(ST_MakePoint(-74.0080, 40.7148), 4326), 'distribution_center', 500.0,
     '{"monday": {"start": "07:00", "end": "19:00"}, "tuesday": {"start": "07:00", "end": "19:00"}, "wednesday": {"start": "07:00", "end": "19:00"}}');

-- Insert vehicles with specific IDs for easier reference
do $$
declare
    van_id uuid;
    small_truck_id uuid;
    large_truck_id uuid;
begin
    -- Insert vehicles and store their IDs
    insert into public.vehicles (type, capacity_m3, max_weight_kg, status, current_location_id)
    values ('van', 10.0, 1000.0, 'available', (select id from public.locations where name = 'Main Warehouse'))
    returning id into van_id;

    insert into public.vehicles (type, capacity_m3, max_weight_kg, status, current_location_id)
    values ('truck', 30.0, 5000.0, 'available', (select id from public.locations where name = 'Main Warehouse'))
    returning id into small_truck_id;

    insert into public.vehicles (type, capacity_m3, max_weight_kg, status, current_location_id)
    values ('truck', 80.0, 15000.0, 'available', (select id from public.locations where name = 'Downtown Distribution Center'))
    returning id into large_truck_id;

    -- Insert drivers with specific vehicle IDs
    insert into public.drivers (name, license, status, vehicle_id) values
        ('John Smith', 'CDL-A-12345', 'available', van_id),
        ('Jane Doe', 'CDL-A-67890', 'available', small_truck_id),
        ('Mike Johnson', 'CDL-A-54321', 'available', large_truck_id);
end $$; 