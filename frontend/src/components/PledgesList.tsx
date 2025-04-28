/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tabs, Card, Text, Group, Badge, Button, Stack, LoadingOverlay } from '@mantine/core'
import { useAccount, useReadContract, useWriteContract } from 'wagmi'
import PledgeArtifact from '../../../artifacts/contracts/Pledge.sol/Pledge.json'
import { contractAddress } from '../config'
import { notifications } from '@mantine/notifications'
import dayjs from 'dayjs'
import { useState } from 'react'

const PledgeAbi = PledgeArtifact.abi

export function PledgesList() {
  const { address } = useAccount()
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')

  // 1. Leer los IDs de los compromisos del usuario
  const { data: pledgeIds = [], isLoading: isLoadingIds } = useReadContract({
    address: contractAddress,
    abi: PledgeAbi,
    functionName: 'getUserCommitments',
    args: [address],
    query: {
      enabled: !!address,
    },
  })

  // 2. Leer detalles de cada compromiso
  const pledgesQuery = useReadContract({
    address: contractAddress,
    abi: PledgeAbi,
    functionName: 'getCommitmentDetails',
    args: pledgeIds.length > 0 ? pledgeIds : undefined,
    query: {
      enabled: pledgeIds.length > 0,
    },
  })

  // 3. Filtrar compromisos según la pestaña activa
  const filteredPledges = (pledgesQuery.data || []).filter(pledge => {
    if (activeTab === 'active') {
      return !pledge.completed && !pledge.claimed
    } else {
      return pledge.completed || pledge.claimed
    }
  })

  return (
    <Tabs value={activeTab} onChange={(value) => setActiveTab(value as any)}>
      <Tabs.List>
        <Tabs.Tab value="active">Activos</Tabs.Tab>
        <Tabs.Tab value="completed">Completados</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="active" pt="md">
        <Stack>
          {!address && (
            <Text ta="center" c="dimmed">Conectá tu wallet para ver tus compromisos</Text>
          )}

          {isLoadingIds && <LoadingOverlay visible />}

          {address && filteredPledges.length === 0 && !isLoadingIds && (
            <Text ta="center" c="dimmed">No hay compromisos activos</Text>
          )}

          {filteredPledges.map((pledge, index) => (
            <PledgeCard
              key={index}
              pledge={pledge}
              id={pledgeIds[index]}
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
              id={pledgeIds[index]}
              isActive={false}
            />
          ))}
        </Stack>
      </Tabs.Panel>
    </Tabs>
  )
}

function PledgeCard({ pledge, id, isActive }: { pledge: any, id: bigint, isActive: boolean }) {
  const { writeContract: markComplete, isPending: isCompleting } = useWriteContract()
  const { writeContract: claimStake, isPending: isClaiming } = useWriteContract()

  const handleComplete = async () => {
    try {
      await markComplete({
        address: contractAddress,
        abi: PledgeAbi,
        functionName: 'markAsCompleted',
        args: [id],
      })
      notifications.show({
        title: 'Éxito',
        message: 'Compromiso marcado como completado',
        color: 'green',
      })
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message,
        color: 'red',
      })
    }
  }

  const handleClaim = async () => {
    try {
      await claimStake({
        address: contractAddress,
        abi: PledgeAbi,
        functionName: 'claimStake',
        args: [id],
      })
      notifications.show({
        title: 'Éxito',
        message: 'Stake reclamado correctamente',
        color: 'green',
      })
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message,
        color: 'red',
      })
    }
  }

  const status = pledge.completed
    ? 'Completado'
    : dayjs.unix(Number(pledge.deadline)).isBefore(dayjs())
      ? 'Vencido'
      : 'Activo'

  return (
    <Card withBorder shadow="sm" padding="lg">
      <Text fw={500} mb="xs">{pledge.description}</Text>

      <Group mb="xs">
        <Badge color={status === 'Completado' ? 'green' : status === 'Vencido' ? 'red' : 'blue'}>
          {status}
        </Badge>
        <Text size="sm" c="dimmed">
          Fecha límite: {dayjs.unix(Number(pledge.deadline)).format('MMM D, YYYY')}
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
  )
}