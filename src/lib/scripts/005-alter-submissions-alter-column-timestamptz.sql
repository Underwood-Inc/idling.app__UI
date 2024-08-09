begin;
set local timezone='UTC';
alter table submissions alter column submission_datetime type timestamptz USING submission_datetime::timestamp with time zone;
commit;