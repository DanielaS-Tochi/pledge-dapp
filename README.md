# Pledge dApp

Una aplicación descentralizada (dApp) para gestionar compromisos ("pledges") en la blockchain. El proyecto incluye un smart contract desarrollado con Hardhat y una interfaz web construida con React y TypeScript.

## Características

- Crear y consultar compromisos en la blockchain.
- Interfaz web moderna y fácil de usar.
- Integración con MetaMask u otras wallets compatibles con EVM.
- Uso de tecnologías: Hardhat, Ethers.js, React, TypeScript.

## Requisitos

- Node.js >= 16.x
- npm o yarn
- MetaMask u otra wallet compatible

## Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/danielas-tochi/pledge-dapp.git
   cd pledge-dapp
   ```

2. Instala las dependencias:
   ```bash
   npm install
   cd frontend
   npm install
   ```

Uso
1. Desplegar los Smart Contracts
Desde la raíz del proyecto:

```bash
npx hardhat compile
npx hardhat test
npx hardhat node
# En otra terminal:
npx hardhat run scripts/deploy.ts --network localhost
```

2. Ejecutar la Aplicación Web
En el directorio frontend:

```bash
npm run dev
```

Abre http://localhost:5173 en tu navegador.

Personalización
Modifica los contratos en contracts/ según tus necesidades.
Ajusta la configuración de red en frontend/src/config.ts.
Contribución
¡Las contribuciones son bienvenidas! Por favor, abre un issue o un pull request.
