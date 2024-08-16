CREATE ROLE runner WITH LOGIN PASSWORD 'postgres';

create database mydatabase with owner = postgres;

\c mydatabase;

CREATE TABLE submissions (
  submission_id SERIAL NOT NULL PRIMARY KEY,
  submission_name VARCHAR(255),
  submission_datetime VARCHAR(255),
  author_id varchar(255),
  tags text[]
);

ALTER USER postgres WITH PASSWORD postgres;

begin;
set local timezone='UTC';
alter table submissions alter column submission_datetime type timestamptz USING submission_datetime::timestamp with time zone;
commit;