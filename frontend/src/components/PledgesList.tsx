/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tabs, Card, Text, Group, Badge, Button, Stack } from '@mantine/core';
import { useAccount, useWriteContract } from 'wagmi';
import PledgeArtifact from '../../../artifacts/contracts/Pledge.sol/Pledge.json';
import { contractAddress } from '../config';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { readContract } from '@wagmi/core';

// Define el tipo de un compromiso (ajusta los campos según tu contrato)
type Pledge = {
  description: string;
  completed: boolean;
  claimed: boolean;
  deadline: bigint;
  stakeAmount: bigint;
  // Agrega otros campos si tu contrato los tiene
};

const PledgeAbi = PledgeArtifact.abi;

export function PledgesList() {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  // 1. Leer los IDs de los compromisos del usuario
  const { data: pledgeIds = [] } = useQuery<bigint[]>({
    queryKey: ['userCommitments', address],
    queryFn: async (): Promise<bigint[]> => {
      if (!address) return [];
      return await readContract(
        {
          address: contractAddress as `0x${string}`,
          abi: PledgeAbi,
        },
        {
          functionName: 'getUserCommitments',
          args: [address],
        }
      ) as bigint[];
    },
    enabled: !!address,
  });

  // 2. Leer detalles de cada compromiso individualmente
  const pledgeDetailsQueries = useQueries({
    queries: (Array.isArray(pledgeIds) ? pledgeIds : []).map((id) => ({
      queryKey: ['pledgeDetail', id ? id.toString() : ''],
      queryFn: async (): Promise<Pledge> => {
        return await readContract(
          {
            address: contractAddress as `0x${string}`,
            abi: PledgeAbi,
          },
          {
            functionName: 'getCommitmentDetails',
            args: [id],
          }
        ) as Pledge;
      },
      enabled: !!id && !!address,
    })),
  });

  const pledgeDetails = pledgeDetailsQueries.map(q => q.data).filter(Boolean) as Pledge[];

  // Separar compromisos activos y completados
  const activePledges = pledgeDetails.filter(pledge => !pledge.completed);
  const completedPledges = pledgeDetails.filter(pledge => pledge.completed);

  const filteredPledges = activeTab === 'active' ? activePledges : completedPledges;

  return (
    <Tabs value={activeTab} onChange={(value) => setActiveTab(value as 'active' | 'completed')}>
      <Tabs.List>
        <Tabs.Tab value="active">Activos</Tabs.Tab>
        <Tabs.Tab value="completed">Completados</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="active" pt="md">
        <Stack>
          {filteredPledges.length === 0 && (
            <Text ta="center" c="dimmed">No hay compromisos activos</Text>
          )}

          {filteredPledges.map((pledge, index) => (
            <PledgeCard
              key={index}
              pledge={pledge}
              id={Array.isArray(pledgeIds) ? pledgeIds[index] : 0n}
              isActive={true}
            />
          ))}
        </Stack>
      </Tabs.Panel>

      <Tabs.Panel value="completed" pt="md">
        <Stack>
          {filteredPledges.length === 0 && (
            <Text ta="center" c="dimmed">No hay compromisos completados</Text>
          )}

          {filteredPledges.map((pledge, index) => (
            <PledgeCard
              key={index}
              pledge={pledge}
              id={Array.isArray(pledgeIds) ? pledgeIds[index] : 0n}
              isActive={false}
            />
          ))}
        </Stack>
      </Tabs.Panel>
    </Tabs>
  );
}

// Card para mostrar un compromiso
function PledgeCard({ pledge, id, isActive }: { pledge: Pledge, id: bigint, isActive: boolean }) {
  const { writeContract: markComplete, isPending: isCompleting } = useWriteContract();
  const { writeContract: claimStake, isPending: isClaiming } = useWriteContract();

  const handleComplete = async () => {
    try {
      markComplete({
        address: contractAddress,
        abi: PledgeAbi,
        functionName: 'markAsCompleted',
        args: [id],
      }, {});
      notifications.show({
        title: 'Éxito',
        message: 'Compromiso marcado como completado',
        color: 'green',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message,
        color: 'red',
      });
    }
  };

  const handleClaim = async () => {
    try {
      claimStake({
        address: contractAddress,
        abi: PledgeAbi,
        functionName: 'claimStake',
        args: [id],
      }, {});
      notifications.show({
        title: 'Éxito',
        message: 'Stake reclamado correctamente',
        color: 'green',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message,
        color: 'red',
      });
    }
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between" mb="xs">
        <Text fw={500}>{pledge.description}</Text>
        <Badge color={pledge.completed ? 'green' : 'blue'}>
          {pledge.completed ? 'Completado' : 'Activo'}
        </Badge>
      </Group>
      <Group justify="space-between" mb="xs">
        <Text size="sm" c="dimmed">
          Fecha límite: {dayjs(Number(pledge.deadline) * 1000).format('DD/MM/YYYY')}
        </Text>
        <Text size="sm" c="dimmed">
          Stake: {Number(pledge.stakeAmount) / 1e18} ETH
        </Text>
      </Group>

      {isActive && !pledge.completed && (
        <Button
          onClick={handleComplete}
          loading={isCompleting}
          fullWidth
          mt="md"
        >
          Marcar como completado
        </Button>
      )}

      {!pledge.claimed && (
        <Button
          onClick={handleClaim}
          loading={isClaiming}
          variant="light"
          fullWidth
          mt="xs"
        >
          {pledge.completed ? 'Reclamar Stake' : 'Donar Stake'}
        </Button>
      )}
    </Card>
  );
}