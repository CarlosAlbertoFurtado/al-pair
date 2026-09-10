FROM node:22-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar todas as dependências (incluindo dev para o build)
RUN npm install

# Copiar o restante do código
COPY . .

# Gerar o client do Prisma e fazer o build
RUN npx prisma generate
RUN npm run build

# Estágio de produção
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar apenas dependências de produção
RUN npm install --omit=dev

# Copiar o build e o client do Prisma gerado do estágio anterior
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Expor a porta da aplicação (Railway fornece a variável PORT automaticamente)
EXPOSE 8080

# Comando para iniciar o servidor
CMD ["npm", "start"]
