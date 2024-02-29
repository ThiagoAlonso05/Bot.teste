CREATE DATABASE Calendario;
USE Calendario;

CREATE TABLE Reserva (
    idReserva INT NOT NULL AUTO_INCREMENT,
    horarioReserva INT(4) NOT NULL,
    Nome VARCHAR(50) NOT NULL,
    CPF INT(11) NOT NULL,
    Telefone INT(10) NOT NULL,

    PRIMARY KEY (idReserva)
);
