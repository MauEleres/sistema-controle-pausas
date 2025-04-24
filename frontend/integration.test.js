import request from 'supertest';
import app from '../src/app';
import { sequelize } from '../src/database/models';

describe('Testes de Integração da API', () => {
  let authToken;
  let adminToken;
  let supervisorToken;
  let atendenteToken;

  beforeAll(async () => {
    // Limpar o banco de dados e criar dados iniciais para teste
    await sequelize.sync({ force: true });
    
    // Criar usuários de teste
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Admin Teste',
        email: 'admin@teste.com',
        password: 'senha123',
        role: 'admin'
      });
      
    // Obter tokens para cada tipo de usuário
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@teste.com',
        password: 'senha123'
      });
    adminToken = adminLogin.body.token;
    
    // Criar equipe
    const equipeResponse = await request(app)
      .post('/api/admin/teams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Equipe Teste',
        description: 'Equipe para testes'
      });
    const equipeId = equipeResponse.body.team.id;
    
    // Criar supervisor
    await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Supervisor Teste',
        email: 'supervisor@teste.com',
        password: 'senha123',
        role: 'supervisor',
        teamId: equipeId
      });
    
    // Criar atendente
    await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Atendente Teste',
        email: 'atendente@teste.com',
        password: 'senha123',
        role: 'atendente',
        teamId: equipeId
      });
    
    // Login como supervisor
    const supervisorLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'supervisor@teste.com',
        password: 'senha123'
      });
    supervisorToken = supervisorLogin.body.token;
    
    // Login como atendente
    const atendenteLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'atendente@teste.com',
        password: 'senha123'
      });
    atendenteToken = atendenteLogin.body.token;
    
    // Criar tipos de pausa
    await request(app)
      .post('/api/supervisor/pause-types')
      .set('Authorization', `Bearer ${supervisorToken}`)
      .send({
        name: 'Almoço',
        description: 'Pausa para almoço',
        maxDuration: 60
      });
      
    await request(app)
      .post('/api/supervisor/pause-types')
      .set('Authorization', `Bearer ${supervisorToken}`)
      .send({
        name: 'Banheiro',
        description: 'Pausa para ir ao banheiro',
        maxDuration: 10
      });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Testes de Autenticação', () => {
    test('Deve fazer login com sucesso', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@teste.com',
          password: 'senha123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.role).toBe('admin');
    });
    
    test('Deve retornar erro ao fazer login com credenciais inválidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@teste.com',
          password: 'senhaerrada'
        });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });
    
    test('Deve obter perfil do usuário autenticado', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('admin@teste.com');
    });
  });

  describe('Testes de Funcionalidades do Atendente', () => {
    test('Deve obter tipos de pausa disponíveis', async () => {
      const response = await request(app)
        .get('/api/pauses/types')
        .set('Authorization', `Bearer ${atendenteToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('pauseTypes');
      expect(response.body.pauseTypes.length).toBe(2);
    });
    
    test('Deve iniciar uma pausa', async () => {
      const response = await request(app)
        .post('/api/pauses/start')
        .set('Authorization', `Bearer ${atendenteToken}`)
        .send({
          pauseTypeId: 1,
          notes: 'Teste de pausa'
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('pauseRecord');
      expect(response.body.pauseRecord.status).toBe('em_andamento');
    });
    
    test('Deve finalizar uma pausa', async () => {
      // Primeiro, obter o ID da pausa ativa
      const historyResponse = await request(app)
        .get('/api/pauses/history?status=em_andamento')
        .set('Authorization', `Bearer ${atendenteToken}`);
      
      const pauseId = historyResponse.body.pauseHistory[0].id;
      
      const response = await request(app)
        .post(`/api/pauses/end/${pauseId}`)
        .set('Authorization', `Bearer ${atendenteToken}`)
        .send({
          notes: 'Finalizando teste de pausa'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('pauseRecord');
      expect(response.body.pauseRecord.status).toBe('finalizada');
    });
  });

  describe('Testes de Funcionalidades do Supervisor', () => {
    test('Deve obter membros da equipe', async () => {
      const response = await request(app)
        .get('/api/supervisor/team-members')
        .set('Authorization', `Bearer ${supervisorToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('teamMembers');
      expect(response.body.teamMembers.length).toBe(1); // Apenas o atendente
    });
    
    test('Deve criar um novo tipo de pausa', async () => {
      const response = await request(app)
        .post('/api/supervisor/pause-types')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          name: 'Treinamento',
          description: 'Pausa para treinamento',
          maxDuration: 120
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('pauseType');
      expect(response.body.pauseType.name).toBe('Treinamento');
    });
  });

  describe('Testes de Funcionalidades do Admin', () => {
    test('Deve obter todos os usuários', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('users');
      expect(response.body.users.length).toBe(3); // Admin, Supervisor e Atendente
    });
    
    test('Deve obter todas as equipes', async () => {
      const response = await request(app)
        .get('/api/admin/teams')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('teams');
      expect(response.body.teams.length).toBe(1);
    });
    
    test('Deve criar um novo usuário', async () => {
      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Novo Atendente',
          email: 'novo@teste.com',
          password: 'senha123',
          role: 'atendente',
          teamId: 1
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.name).toBe('Novo Atendente');
    });
  });

  describe('Testes de Controle de Acesso', () => {
    test('Atendente não deve acessar rotas de supervisor', async () => {
      const response = await request(app)
        .get('/api/supervisor/team-members')
        .set('Authorization', `Bearer ${atendenteToken}`);
      
      expect(response.status).toBe(403);
    });
    
    test('Supervisor não deve acessar rotas de admin', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${supervisorToken}`);
      
      expect(response.status).toBe(403);
    });
    
    test('Admin deve acessar todas as rotas', async () => {
      const responseSupervisor = await request(app)
        .get('/api/supervisor/team-members')
        .set('Authorization', `Bearer ${adminToken}`);
      
      const responseAtendente = await request(app)
        .get('/api/pauses/types')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(responseSupervisor.status).toBe(200);
      expect(responseAtendente.status).toBe(200);
    });
  });
});
