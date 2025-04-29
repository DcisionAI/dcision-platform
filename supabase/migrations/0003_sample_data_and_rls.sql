-- Add more sample data
insert into public.customers (name, industry, location, address) values
    ('Acme Corp', 'Manufacturing', ST_SetSRID(ST_MakePoint(-73.9857, 40.7484), 4326), '1 Times Square, New York, NY'),
    ('TechStart Inc', 'Technology', ST_SetSRID(ST_MakePoint(-73.9772, 40.7527), 4326), '350 5th Ave, New York, NY'),
    ('Global Retail', 'Retail', ST_SetSRID(ST_MakePoint(-73.9814, 40.7518), 4326), '200 W 34th St, New York, NY'),
    ('HealthPlus', 'Healthcare', ST_SetSRID(ST_MakePoint(-73.9780, 40.7559), 4326), '1 Penn Plaza, New York, NY'),
    ('EcoSupplies', 'Sustainability', ST_SetSRID(ST_MakePoint(-73.9834, 40.7505), 4326), '7 W 34th St, New York, NY');

-- Add sample orders
insert into public.orders (customer_id, order_date, delivery_date, status, priority, total_value) values
    ((select id from public.customers where name = 'Acme Corp'), 
     now() - interval '2 days', 
     now() + interval '1 day', 
     'pending', 
     'high', 
     1500.00),
    ((select id from public.customers where name = 'TechStart Inc'), 
     now() - interval '1 day', 
     now() + interval '2 days', 
     'pending', 
     'medium', 
     2500.00),
    ((select id from public.customers where name = 'Global Retail'), 
     now(), 
     now() + interval '3 days', 
     'pending', 
     'low', 
     3500.00),
    ((select id from public.customers where name = 'HealthPlus'), 
     now() - interval '3 days', 
     now() + interval '1 day', 
     'pending', 
     'high', 
     2000.00),
    ((select id from public.customers where name = 'EcoSupplies'), 
     now() - interval '1 day', 
     now() + interval '2 days', 
     'pending', 
     'medium', 
     1800.00);

-- Add sample order items
insert into public.order_items (order_id, product_id, quantity, unit_price)
select 
    o.id as order_id,
    p.id as product_id,
    floor(random() * 10 + 1) as quantity,
    p.unit_price
from 
    public.orders o
    cross join public.products p
where 
    random() < 0.7;  -- Add items to ~70% of orders

-- Add time windows for locations
insert into public.time_windows (location_id, day_of_week, start_time, end_time)
select 
    l.id as location_id,
    d.day,
    '08:00'::time as start_time,
    '18:00'::time as end_time
from 
    public.locations l
    cross join generate_series(0, 6) as d(day);

-- Add RLS policies
-- Customers: Only authenticated users can view, only admins can modify
do $$
begin
    if not exists (
        select 1 from pg_policies 
        where schemaname = 'public' 
        and tablename = 'customers' 
        and policyname = 'Customers viewable by authenticated users'
    ) then
        create policy "Customers viewable by authenticated users"
            on public.customers for select
            using (auth.role() = 'authenticated');
    end if;
end $$;

do $$
begin
    if not exists (
        select 1 from pg_policies 
        where schemaname = 'public' 
        and tablename = 'customers' 
        and policyname = 'Customers modifiable by admins'
    ) then
        create policy "Customers modifiable by admins"
            on public.customers for all
            using (auth.role() = 'authenticated' and auth.uid() in (
                select id from auth.users where raw_user_meta_data->>'role' = 'admin'
            ));
    end if;
end $$;

-- Orders: Users can view their own orders, admins can view all
do $$
begin
    if not exists (
        select 1 from pg_policies 
        where schemaname = 'public' 
        and tablename = 'orders' 
        and policyname = 'Orders viewable by owners and admins'
    ) then
        create policy "Orders viewable by owners and admins"
            on public.orders for select
            using (
                auth.role() = 'authenticated' and (
                    customer_id in (
                        select id from public.customers 
                        where id in (
                            select customer_id from public.orders 
                            where auth.uid() = customer_id
                        )
                    ) or
                    auth.uid() in (
                        select id from auth.users 
                        where raw_user_meta_data->>'role' = 'admin'
                    )
                )
            );
    end if;
end $$;

-- Products: Read-only for authenticated users, modifiable by admins
do $$
begin
    if not exists (
        select 1 from pg_policies 
        where schemaname = 'public' 
        and tablename = 'products' 
        and policyname = 'Products viewable by authenticated users'
    ) then
        create policy "Products viewable by authenticated users"
            on public.products for select
            using (auth.role() = 'authenticated');
    end if;
end $$;

do $$
begin
    if not exists (
        select 1 from pg_policies 
        where schemaname = 'public' 
        and tablename = 'products' 
        and policyname = 'Products modifiable by admins'
    ) then
        create policy "Products modifiable by admins"
            on public.products for all
            using (auth.role() = 'authenticated' and auth.uid() in (
                select id from auth.users where raw_user_meta_data->>'role' = 'admin'
            ));
    end if;
end $$;

-- Locations: Read-only for authenticated users, modifiable by admins
do $$
begin
    if not exists (
        select 1 from pg_policies 
        where schemaname = 'public' 
        and tablename = 'locations' 
        and policyname = 'Locations viewable by authenticated users'
    ) then
        create policy "Locations viewable by authenticated users"
            on public.locations for select
            using (auth.role() = 'authenticated');
    end if;
end $$;

do $$
begin
    if not exists (
        select 1 from pg_policies 
        where schemaname = 'public' 
        and tablename = 'locations' 
        and policyname = 'Locations modifiable by admins'
    ) then
        create policy "Locations modifiable by admins"
            on public.locations for all
            using (auth.role() = 'authenticated' and auth.uid() in (
                select id from auth.users where raw_user_meta_data->>'role' = 'admin'
            ));
    end if;
end $$;

-- Vehicles: Read-only for authenticated users, modifiable by admins
do $$
begin
    if not exists (
        select 1 from pg_policies 
        where schemaname = 'public' 
        and tablename = 'vehicles' 
        and policyname = 'Vehicles viewable by authenticated users'
    ) then
        create policy "Vehicles viewable by authenticated users"
            on public.vehicles for select
            using (auth.role() = 'authenticated');
    end if;
end $$;

do $$
begin
    if not exists (
        select 1 from pg_policies 
        where schemaname = 'public' 
        and tablename = 'vehicles' 
        and policyname = 'Vehicles modifiable by admins'
    ) then
        create policy "Vehicles modifiable by admins"
            on public.vehicles for all
            using (auth.role() = 'authenticated' and auth.uid() in (
                select id from auth.users where raw_user_meta_data->>'role' = 'admin'
            ));
    end if;
end $$;

-- Drivers: Read-only for authenticated users, modifiable by admins
do $$
begin
    if not exists (
        select 1 from pg_policies 
        where schemaname = 'public' 
        and tablename = 'drivers' 
        and policyname = 'Drivers viewable by authenticated users'
    ) then
        create policy "Drivers viewable by authenticated users"
            on public.drivers for select
            using (auth.role() = 'authenticated');
    end if;
end $$;

do $$
begin
    if not exists (
        select 1 from pg_policies 
        where schemaname = 'public' 
        and tablename = 'drivers' 
        and policyname = 'Drivers modifiable by admins'
    ) then
        create policy "Drivers modifiable by admins"
            on public.drivers for all
            using (auth.role() = 'authenticated' and auth.uid() in (
                select id from auth.users where raw_user_meta_data->>'role' = 'admin'
            ));
    end if;
end $$;

-- Time Windows: Read-only for authenticated users, modifiable by admins
do $$
begin
    if not exists (
        select 1 from pg_policies 
        where schemaname = 'public' 
        and tablename = 'time_windows' 
        and policyname = 'Time windows viewable by authenticated users'
    ) then
        create policy "Time windows viewable by authenticated users"
            on public.time_windows for select
            using (auth.role() = 'authenticated');
    end if;
end $$;

do $$
begin
    if not exists (
        select 1 from pg_policies 
        where schemaname = 'public' 
        and tablename = 'time_windows' 
        and policyname = 'Time windows modifiable by admins'
    ) then
        create policy "Time windows modifiable by admins"
            on public.time_windows for all
            using (auth.role() = 'authenticated' and auth.uid() in (
                select id from auth.users where raw_user_meta_data->>'role' = 'admin'
            ));
    end if;
end $$; 