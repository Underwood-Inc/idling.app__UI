create table users (
  id uuid DEFAULT gen_random_uuid() UNIQUE PRIMARY KEY,
  username varchar(50) UNIQUE,
  email varchar(50) UNIQUE,
  twitch_id varchar(50) UNIQUE,
  created_date date not null DEFAULT CURRENT_DATE
);