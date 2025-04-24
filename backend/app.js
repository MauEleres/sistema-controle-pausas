const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Exemplo de rota para testar
app.get('/', (req, res) => {
  res.send('API funcionando!');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
