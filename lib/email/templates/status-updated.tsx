import {
  Body, Button, Container, Head, Heading, Hr,
  Html, Preview, Section, Text,
} from '@react-email/components'
import type { LeaveStatus } from '@/types'

interface StatusUpdatedEmailProps {
  employeeName: string
  leaveType: string
  startDate: string
  endDate: string
  status: LeaveStatus
  managerComment?: string
  dashboardUrl: string
}

const STATUS_COLORS: Record<LeaveStatus, string> = {
  approved: '#dcfce7',
  rejected: '#fee2e2',
  compensated: '#dbeafe',
  pending: '#fef9c3',
}

const STATUS_TEXT: Record<LeaveStatus, string> = {
  approved: '#166534',
  rejected: '#991b1b',
  compensated: '#1e40af',
  pending: '#854d0e',
}

export function StatusUpdatedEmail({
  employeeName,
  leaveType,
  startDate,
  endDate,
  status,
  managerComment,
  dashboardUrl,
}: StatusUpdatedEmailProps) {
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1)

  return (
    <Html>
      <Head />
      <Preview>Your leave request has been {status}</Preview>
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '560px', margin: '40px auto', backgroundColor: '#fff', borderRadius: '8px', padding: '32px' }}>
          <Heading style={{ color: '#111827', fontSize: '20px' }}>
            Leave Request Update
          </Heading>
          <Text style={{ color: '#374151' }}>
            Hi <strong>{employeeName}</strong>, your leave request has been reviewed.
          </Text>
          <Section style={{
            backgroundColor: STATUS_COLORS[status],
            borderRadius: '6px',
            padding: '12px 16px',
            margin: '16px 0',
          }}>
            <Text style={{ margin: 0, fontWeight: 'bold', color: STATUS_TEXT[status], fontSize: '16px' }}>
              Status: {statusLabel}
            </Text>
          </Section>
          <Section style={{ backgroundColor: '#f3f4f6', borderRadius: '6px', padding: '16px', margin: '16px 0' }}>
            <Text style={{ margin: '4px 0', color: '#374151' }}><strong>Type:</strong> {leaveType}</Text>
            <Text style={{ margin: '4px 0', color: '#374151' }}><strong>From:</strong> {startDate}</Text>
            <Text style={{ margin: '4px 0', color: '#374151' }}><strong>To:</strong> {endDate}</Text>
            {managerComment && (
              <Text style={{ margin: '4px 0', color: '#374151' }}><strong>Manager&apos;s note:</strong> {managerComment}</Text>
            )}
          </Section>
          <Button
            href={dashboardUrl}
            style={{ backgroundColor: '#2563eb', color: '#fff', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block' }}
          >
            View Details
          </Button>
          <Hr style={{ margin: '24px 0', borderColor: '#e5e7eb' }} />
          <Text style={{ color: '#9ca3af', fontSize: '12px' }}>AwayDay — Leave Management</Text>
        </Container>
      </Body>
    </Html>
  )
}
