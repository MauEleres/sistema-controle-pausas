const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/database');

const sequelize = new Sequelize(config.development);

// Modelo de Usuário
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('atendente', 'supervisor', 'admin'),
    defaultValue: 'atendente'
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
});

// Modelo de Equipe
const Team = sequelize.define('Team', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
});

// Modelo de Tipo de Pausa
const PauseType = sequelize.define('PauseType', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  maxDuration: {
    type: DataTypes.INTEGER,
    comment: 'Duração máxima em minutos'
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
});

// Modelo de Registro de Pausa
const PauseRecord = sequelize.define('PauseRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endTime: {
    type: DataTypes.DATE
  },
  duration: {
    type: DataTypes.INTEGER,
    comment: 'Duração em minutos'
  },
  status: {
    type: DataTypes.ENUM('em_andamento', 'finalizada', 'cancelada'),
    defaultValue: 'em_andamento'
  },
  notes: {
    type: DataTypes.TEXT
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
});

// Relacionamentos
User.belongsTo(Team);
Team.hasMany(User);

PauseRecord.belongsTo(User);
User.hasMany(PauseRecord);

PauseRecord.belongsTo(PauseType);
PauseType.hasMany(PauseRecord);

// Exportar os modelos
const models = {
  User,
  Team,
  PauseType,
  PauseRecord,
  sequelize
};

module.exports = models;
