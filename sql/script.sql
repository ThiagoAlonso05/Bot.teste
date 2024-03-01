DROP schema if exists Calendario;
CREATE DATABASE Calendario;
USE Calendario;



CREATE TABLE Dias (
    idDia INT AUTO_INCREMENT PRIMARY KEY,
    data DATE NOT NULL,
    UNIQUE KEY(data)
);

SELECT * FROM Dias;

CREATE TABLE Horarios (
    idHorario INT AUTO_INCREMENT PRIMARY KEY,
    horario TIME NOT NULL,
    UNIQUE KEY(horario)
);

SELECT * FROM Horarios;

CREATE TABLE Disponibilidade (
    idDisponibilidade INT AUTO_INCREMENT PRIMARY KEY,
    idDia INT,
    idHorario INT,
    disponivel BOOLEAN NOT NULL DEFAULT true,
    FOREIGN KEY (idDia) REFERENCES Dias(idDia),
    FOREIGN KEY (idHorario) REFERENCES Horarios(idHorario),
    UNIQUE KEY(idDia, idHorario)
);

SELECT * FROM Disponibilidade;

CREATE TABLE Reserva (
    idReserva INT NOT NULL AUTO_INCREMENT,
    dataReserva DATE NOT NULL,
    horarioReserva VARCHAR(10) NOT NULL,
    Nome VARCHAR(60) NOT NULL,
    CPF VARCHAR(20) NOT NULL,
    Telefone VARCHAR(20) NOT NULL,

    PRIMARY KEY (idReserva)
);

SELECT * FROM Reserva;

INSERT INTO Horarios (horario) VALUES
('09:00'),
('10:00'),
('11:00'),
('12:00'),
('13:00'),
('14:00'),
('15:00'),
('16:00'),
('17:00');

INSERT INTO Dias (data) VALUES
('2024-03-04'),  -- Segunda-feira
('2024-03-05'),  -- Terça-feira
('2024-03-06'),  -- Quarta-feira
('2024-03-07'),  -- Quinta-feira
('2024-03-08');  -- Sexta-feira

INSERT INTO Disponibilidade (idDia, idHorario)
SELECT d.idDia, h.idHorario
FROM Dias d
CROSS JOIN Horarios h
WHERE d.data BETWEEN '2024-03-04' AND '2024-03-08';