DROP schema if exists Calendario;
CREATE DATABASE Calendario;
USE Calendario;

Drop table reserva;
CREATE TABLE Reserva (
    idReserva INT NOT NULL AUTO_INCREMENT,
    horarioReserva VARCHAR(50) NOT NULL,
    Nome VARCHAR(500) NOT NULL,
    CPF VARCHAR(150) NOT NULL,
    Telefone VARCHAR(150) NOT NULL,

    PRIMARY KEY (idReserva)
);

SELECT * FROM Reserva;

CREATE TABLE HorariosDisponiveis (
    idHorario INT AUTO_INCREMENT,
    horario TIME NOT NULL ,
    disponivel BOOLEAN NOT NULL DEFAULT true,
    PRIMARY KEY (idHorario)
);

Select * from HorariosDisponiveis;

drop table HorariosDisponiveis;

ALTER TABLE HorariosDisponiveis
ADD UNIQUE (horario);


INSERT INTO HorariosDisponiveis (horario, disponivel) VALUES
('09:00', true),
('10:00', true),
('11:00', true),
('12:00', true),
('13:00', true),
('14:00', true),
('15:00', true),
('16:00', true),
('17:00', true);