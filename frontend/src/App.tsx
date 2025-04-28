import { useDisclosure } from '@mantine/hooks';
import { AppShell, Button, Group } from '@mantine/core';
import { ConnectButton } from './components/ConnectButton';
import { CreatePledgeModal } from './components/CreatePledgeModal';
import { PledgesList } from './components/PledgesList';
import { useAccount } from 'wagmi';
import './index.css';

export function App() {
  const [opened, { open, close }] = useDisclosure(false);
  const { isConnected } = useAccount();

  return (
    <AppShell
      header={{ height: 60 }}
      padding="md"
    >
      <AppShell.Header
        style={{
          background: 'var(--primary-light)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <Group h="100%" px="md" justify="space-between">
          <h1 style={{ color: 'white', margin: 0, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '1.8rem', letterSpacing: '.03em' }}>
            Pledge DApp
          </h1>
          <Group gap="md">
            {isConnected && (
              <Button
                onClick={open}
                variant="gradient"
                gradient={{ from: 'cyan', to: 'indigo' }}
                radius="md"
                size="md"
                style={{ fontWeight: 600, letterSpacing: '.03em' }}
              >
                New Pledge
              </Button>
            )}
            <ConnectButton />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <PledgesList />
        <CreatePledgeModal opened={opened} close={close} />
      </AppShell.Main>
    </AppShell>
  );
}