CREATE TABLE "session" (
	"sid" varchar NOT NULL COLLATE "default",
	"sess" json NOT NULL,
	"expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX "IDX_session_expire" ON "session" ("expire");

--

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


-- Alternative method of designing things which would probably be more efficient. Didn't see that method
-- until I had coded different parts of my app around what is already here.
	-- https://dba.stackexchange.com/a/192767/209246

CREATE TABLE msgs (
	mid SERIAL PRIMARY KEY,
	uid INT NOT NULL REFERENCES users(uid),
	rid INT NOT NULL REFERENCES rooms(rid),
	msg TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX msgs_uid_index ON msgs(uid);
CREATE INDEX msgs_rid_index ON msgs(rid);

--

CREATE TABLE users_rooms (
	uid INT REFERENCES users(uid),
	rid INT REFERENCES rooms(rid),
	PRIMARY KEY(uid, rid)
);

--

CREATE TABLE dms (
	dmid SERIAL PRIMARY KEY,
	uid INT NOT NULL REFERENCES users(uid),
	recip INT NOT NULL REFERENCES users(uid),
	msg TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX dms_uid_index ON dms(uid);
CREATE INDEX dms_recip_index ON dms(recip);

--

CREATE TABLE users_dms (
	uid INT REFERENCES users(uid),
	recip INT REFERENCES users(uid),
	PRIMARY KEY(uid, recip)
);

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

-- Finished with creating tables. Insert default data and create triggers.

-- Every user should automatically join the General chatroom.
INSERT INTO rooms(rname) VALUES ('General');

CREATE OR REPLACE FUNCTION join_default_room()
	RETURNS trigger AS
		$$ BEGIN
			INSERT INTO users_rooms(uid, rid) VALUES (NEW.uid, 1);
			RETURN NEW;
		END; $$
LANGUAGE 'plpgsql';

CREATE TRIGGER join_general AFTER INSERT ON users
FOR EACH ROW EXECUTE PROCEDURE join_default_room();

-- Test trigger.
INSERT INTO users(uname) VALUES('bob');

-- DELETE ALL DATA
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;
-- GRANT ALL ON SCHEMA public TO postgres;
-- GRANT ALL ON SCHEMA public TO public;
-- COMMENT ON SCHEMA public IS 'standard public schema';
