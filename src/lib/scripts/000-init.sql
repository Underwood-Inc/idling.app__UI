create database testing;

\c testing;

CREATE TABLE submissions (
  submission_id SERIAL NOT NULL PRIMARY KEY,
  submission_name VARCHAR(255),
  submission_datetime VARCHAR(255)
);

alter table submissions
add author_id varchar(255);

alter table submissions
add tags text[];

begin;
set local timezone='UTC';
alter table submissions alter column submission_datetime type timestamptz USING submission_datetime::timestamp with time zone;
commit;