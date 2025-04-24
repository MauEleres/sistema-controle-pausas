const { Sequelize, DataTypes } = require('sequelize');

// Configuração de conexão com SSL
const sequelize = new Sequelize('pausas_db', 'pausas_admin', 'cjasUVlJCNu4ApcmLjngYJD8EDhLgDAm', {
  host: 'dpg-d04kj02dbo4c73emstp0-a.ohio-postgres.render.com',
  port: 5432,
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

// Modelo do usuário (ajuste conforme seu projeto real)
const Usuario = sequelize.define('usuarios', {
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  senha: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  timestamps: false
});

// Criação do admin
async function criarAdmin() {
  try {
    await sequelize.authenticate();
    console.log('Conexão OK');

    const adminExistente = await Usuario.findOne({ where: { email: 'admin@admin.com' } });

    if (adminExistente) {
      console.log('⚠️ Admin já existe');
    } else {
      await Usuario.create({
        nome: 'Administrador',
        email: 'admin@admin.com',
        senha: 'admin123' // Troque por uma hash se usar autenticação real
      });
      console.log('✅ Admin criado com sucesso');
    }

    await sequelize.close();
  } catch (error) {
    console.error('Erro ao conectar/criar admin:', error);
  }
}

criarAdmin();
