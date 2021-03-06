create table user (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name CHAR(20) NOT NULL,
    user_name CHAR(20) NOT NULL UNIQUE,
    password VARCHAR(200) NOT NULL

);

create table tournament (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_name VARCHAR(20) NOT NULL REFERENCES user(user_name)
    ON DELETE CASCADE
        ON UPDATE CASCADE,
    name CHAR(20) NOT NULL
);


create table player (
    id INT NOT NULL AUTO_INCREMENT,
    name CHAR(100),
    user_id INT NOT NULL REFERENCES user(id),
    tournament_id INT NOT NULL REFERENCES tournament(id)
    ON DELETE CASCADE
        ON UPDATE CASCADE,
    PRIMARY KEY(id,tournament_id)
    );

create table game (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT NOT NULL REFERENCES tournament(id)
    ON DELETE CASCADE
        ON UPDATE CASCADE,
    player1_id INT NOT NULL REFERENCES player(id)
    ON DELETE CASCADE
        ON UPDATE CASCADE,
    player2_id INT NOT NULL REFERENCES player(id)
    ON DELETE CASCADE
        ON UPDATE CASCADE,
    round smallint NOT NULL,
    winner_id INT NOT NULL REFERENCES player(id)
    ON DELETE CASCADE
        ON UPDATE CASCADE,
    loser_id INT NOT NULL REFERENCES player(id)
    ON DELETE CASCADE
        ON UPDATE CASCADE
    );
