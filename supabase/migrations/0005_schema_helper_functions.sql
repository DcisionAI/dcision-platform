-- Create function to get table columns
create or replace function public.get_table_columns(table_name text)
returns table (
    column_name text,
    data_type text,
    is_nullable text
) security definer
as $$
begin
    return query
    select 
        c.column_name::text,
        c.data_type::text,
        c.is_nullable::text
    from information_schema.columns c
    where c.table_schema = 'public'
    and c.table_name = table_name;
end;
$$ language plpgsql; 