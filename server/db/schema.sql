CREATE extension IF NOT EXISTS citext;

DO $$ BEGIN
	CREATE DOMAIN valid_email AS citext CHECK ( value ~ '^[a-zA-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$' );
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

CREATE TABLE users (
	uid SERIAL PRIMARY KEY,
	pid VARCHAR(40),
	uname VARCHAR(50) NOT NULL,
	email valid_email,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--

CREATE TABLE rooms (
	rid SERIAL PRIMARY KEY,
	rname VARCHAR(40) NOT NULL,
	password VARCHAR(40)
);

--

CREATE TABLE rooms_users (
	rid INT REFERENCES rooms(rid),
	uid INT REFERENCES users(uid),
	PRIMARY KEY(rid, uid)
);

--

CREATE TABLE messages (
	mid BIGSERIAL PRIMARY KEY,
	author INT NOT NULL REFERENCES users(uid),
	room INT NOT NULL REFERENCES rooms(rid),
	message TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX msg_author ON messages(author);
CREATE INDEX msg_in ON messages(room);

--

-- DO $$ BEGIN
-- 	CREATE TYPE valid_friendship_status AS ENUM ('REJECTED', 'ACCEPTED', 'PENDING');
-- EXCEPTION
-- 	WHEN duplicate_object THEN null;
-- END $$;

-- CREATE TABLE friendships (
-- 	id serial PRIMARY KEY,
-- 	user_a INT REFERENCES users(id),
-- 	user_b INT REFERENCES users(id),
-- 	status valid_friendship_status NOT NULL DEFAULT 'PENDING',
-- 	CHECK (user_a < user_b)
-- );

-- CREATE INDEX friendship_user_a ON friendships(user_a);
-- CREATE INDEX friendship_user_b ON friendships(user_b);

--

-- DO $$ BEGIN
-- 	CREATE TYPE valid_difficulty AS ENUM ('NOVICE', 'INTERMEDIATE', 'EXPERT');
-- EXCEPTION
-- 	WHEN duplicate_object THEN null;
-- END $$;

-- CREATE TABLE minesweeper (
-- 	id SERIAL PRIMARY KEY,
-- 	score NUMERIC(4,3) NOT NULL,
-- 	difficulty valid_difficulty NOT NULL,
-- 	user_id INT NOT NULL REFERENCES users(id)
-- );

--

-- DELETE ALL DATA
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;
-- GRANT ALL ON SCHEMA public TO postgres;
-- GRANT ALL ON SCHEMA public TO public;
-- COMMENT ON SCHEMA public IS 'standard public schema';
