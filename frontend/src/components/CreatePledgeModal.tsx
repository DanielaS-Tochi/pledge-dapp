import { Modal, TextInput, NumberInput, Button, Stack } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { notifications } from '@mantine/notifications'
import { contractAddress } from '../config'
// Importa el ABI desde los artifacts de Hardhat
import PledgeArtifact from '../../../artifacts/contracts/Pledge.sol/Pledge.json'

interface CreatePledgeModalProps {
  opened: boolean;
  close: () => void;
}

export function CreatePledgeModal({ opened, close }: CreatePledgeModalProps) {
  const { address } = useAccount()
  const form = useForm({
    initialValues: {
      description: '',
      duration: 7,
      stakeAmount: 0.01,
    },
    validate: {
      description: (value) => value.trim().length > 0 ? null : 'Description is required',
      duration: (value) => value > 0 ? null : 'Duration must be positive',
      stakeAmount: (value) => value > 0 ? null : 'Stake amount must be positive',
    },
  })

  // wagmi v1+ pattern: writeContract returns { data, isPending, error, write }
  const { data: hash, writeContract, isPending, error } = useWriteContract()

  // Confirmación de la transacción
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
    onSuccess: () => {
      notifications.show({
        title: 'Compromiso creado',
        message: '¡Tu compromiso fue creado exitosamente!',
        color: 'green',
      })
      close()
      form.reset()
    },
    onError: () => {
      notifications.show({
        title: 'Error',
        message: 'No se pudo crear el compromiso',
        color: 'red',
      })
    }
  })

  const handleSubmit = (values: typeof form.values) => {
    if (!address) return
    writeContract({
      address: contractAddress,
      abi: PledgeArtifact.abi,
      functionName: 'createCommitment',
      args: [values.description, values.duration],
      value: BigInt(Math.floor(values.stakeAmount * 1e18)),
    })
  }

  return (
    <Modal opened={opened} onClose={close} title="Crear nuevo compromiso">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            label="Descripción"
            placeholder="Voy a correr 5km todos los días"
            {...form.getInputProps('description')}
          />

          <NumberInput
            label="Duración (días)"
            min={1}
            max={365}
            {...form.getInputProps('duration')}
          />

          <NumberInput
            label="Stake (ETH)"
            min={0.001}
            step={0.001}
            precision={3}
            {...form.getInputProps('stakeAmount')}
          />

          <Button
            type="submit"
            loading={isPending || isConfirming}
            disabled={!address}
          >
            Crear compromiso
          </Button>
          {error && (
            <div style={{ color: 'red', marginTop: 8 }}>
              {error.message}
            </div>
          )}
        </Stack>
      </form>
    </Modal>
  )
}