CREATE ROLE runner WITH LOGIN PASSWORD 'postgres';

create database testing;

\c testing;

CREATE TABLE submissions (
  submission_id SERIAL NOT NULL PRIMARY KEY,
  submission_name VARCHAR(255),
  submission_datetime VARCHAR(255),
  author_id varchar(255),
  tags text[]
);

begin;
set local timezone='UTC';
alter table submissions alter column submission_datetime type timestamptz USING submission_datetime::timestamp with time zone;
commit;