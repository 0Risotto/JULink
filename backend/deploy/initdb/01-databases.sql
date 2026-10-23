-- One database per service. Services must never query another service's DB.
CREATE DATABASE julink_identity OWNER julink;
CREATE DATABASE julink_social OWNER julink;
CREATE DATABASE julink_content OWNER julink;
CREATE DATABASE julink_feed OWNER julink;
CREATE DATABASE julink_search OWNER julink;
CREATE DATABASE julink_messaging OWNER julink;
CREATE DATABASE julink_calls OWNER julink;
CREATE DATABASE julink_community OWNER julink;
CREATE DATABASE julink_notifications OWNER julink;
