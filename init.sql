-- Create a user that can connect from any host
CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY 'example';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;

CREATE USER IF NOT EXISTS 'root'@'localhost' IDENTIFIED BY 'example';
ALTER USER 'root'@'%' IDENTIFIED BY 'example';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;