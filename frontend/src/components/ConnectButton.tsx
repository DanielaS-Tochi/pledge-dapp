import { useConnect, useAccount, useDisconnect } from 'wagmi'
import { Button } from '@mantine/core'

export function ConnectButton() {
  const { connect, connectors, isPending, error } = useConnect()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  // Busca el conector injected (MetaMask)
  const injectedConnector = connectors.find(c => c.id === 'injected')

  if (isConnected && address) {
    return (
      <Button
        className="button-danger"
        onClick={() => disconnect()}
        style={{ minWidth: 180 }}
      >
        Desconectar ({address.slice(0, 6)}...{address.slice(-4)})
      </Button>
    )
  }

  return (
    <>
      <Button
        className="button-primary"
        onClick={() => {
          if (injectedConnector) {
            connect({ connector: injectedConnector })
          }
        }}
        loading={isPending}
        style={{ minWidth: 180 }}
        disabled={!injectedConnector}
      >
        Conectar MetaMask
      </Button>
      {error && (
        <div style={{ color: 'var(--danger)', marginTop: 8 }}>
          {error.message.includes('wallet must has at least one account')
            ? 'Por favor, asegúrate de que tu wallet tenga al menos una cuenta creada/importada y esté desbloqueada antes de conectar.'
            : error.message}
        </div>
      )}
    </>
  )
}