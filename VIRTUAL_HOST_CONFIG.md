# Configuração do Virtual Host - Toledo Oficina

## Informações do Servidor
- **IP do Servidor**: 172.20.120.44
- **Domínio Local**: toledo-oficina.local
- **Servidor Web**: Nginx 1.26.0
- **Porta**: 80 (HTTP)

## Arquivos de Configuração

### Virtual Host Nginx
**Localização**: `/etc/nginx/sites-available/toledo-oficina.local`

### Link Simbólico
**Localização**: `/etc/nginx/sites-enabled/toledo-oficina.local`

## Diretórios Importantes
- **Root da Aplicação**: `/opt/OnliFicina/seu-oficina-app/dist`
- **Logs de Acesso**: `/var/log/nginx/toledo-oficina.access.log`
- **Logs de Erro**: `/var/log/nginx/toledo-oficina.error.log`

## Funcionalidades Configuradas

### 1. Aplicação SPA (Single Page Application)
- Configuração `try_files` para roteamento do React
- Fallback para `index.html` em rotas não encontradas

### 2. Cache de Arquivos Estáticos
- Cache de 1 ano para arquivos JS, CSS, imagens e fontes
- Headers de cache otimizados

### 3. Proxy para API
- Roteamento `/api/` para `localhost:3000`
- Headers de proxy configurados
- Suporte a WebSocket em `/ws`

### 4. Segurança
- Headers de segurança configurados:
  - X-Frame-Options
  - X-XSS-Protection
  - X-Content-Type-Options
  - Referrer-Policy
  - Content-Security-Policy

### 5. Otimizações
- Logs desabilitados para favicon e robots.txt
- Bloqueio de arquivos ocultos
- Configurações de performance

## Como Acessar

### Acesso Local
```bash
http://localhost
http://172.20.120.44
http://toledo-oficina.local
```

### Acesso Externo
Para acessar de outras máquinas na rede:
1. Use o IP: `http://172.20.120.44`
2. Ou configure o DNS/hosts da máquina cliente:
   ```
   172.20.120.44 toledo-oficina.local
   ```

## Comandos Úteis

### Verificar Status do Nginx
```bash
sudo systemctl status nginx
```

### Testar Configuração
```bash
sudo nginx -t
```

### Recarregar Configuração
```bash
sudo systemctl reload nginx
```

### Visualizar Logs
```bash
# Logs de acesso
sudo tail -f /var/log/nginx/toledo-oficina.access.log

# Logs de erro
sudo tail -f /var/log/nginx/toledo-oficina.error.log
```

### Rebuild da Aplicação
```bash
cd /opt/OnliFicina/seu-oficina-app
npm run build
```

## Troubleshooting

### Problema: Site não carrega
1. Verificar se o Nginx está rodando
2. Verificar se o build da aplicação existe em `dist/`
3. Verificar logs de erro do Nginx

### Problema: API não funciona
1. Verificar se o backend está rodando na porta 3000
2. Verificar configuração de proxy no Nginx

### Problema: Acesso externo não funciona
1. Verificar firewall (ufw status)
2. Verificar se o IP 172.20.120.44 está correto
3. Verificar configuração de rede

## Configuração Realizada

Data: 05/08/2025
Usuário: alfreire
Servidor: 172.20.120.44

### Passos Executados:
1. ✅ Instalação do Nginx
2. ✅ Parada do Apache (conflito de porta 80)
3. ✅ Criação do arquivo de configuração do virtual host
4. ✅ Habilitação do site (link simbólico)
5. ✅ Teste da configuração
6. ✅ Build da aplicação React
7. ✅ Configuração do arquivo hosts local
8. ✅ Testes de conectividade

### Status: ✅ FUNCIONANDO
- Site acessível via IP: http://172.20.120.44
- Site acessível via domínio: http://toledo-oficina.local
- Configurações de segurança aplicadas
- Cache otimizado para performance
