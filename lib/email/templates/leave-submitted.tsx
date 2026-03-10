import {
  Body, Button, Container, Head, Heading, Hr,
  Html, Preview, Section, Text,
} from '@react-email/components'

interface LeaveSubmittedEmailProps {
  employeeName: string
  leaveType: string
  startDate: string
  endDate: string
  totalDays: number
  reason?: string
  dashboardUrl: string
}

export function LeaveSubmittedEmail({
  employeeName,
  leaveType,
  startDate,
  endDate,
  totalDays,
  reason,
  dashboardUrl,
}: LeaveSubmittedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New leave request from {employeeName}</Preview>
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '560px', margin: '40px auto', backgroundColor: '#fff', borderRadius: '8px', padding: '32px' }}>
          <Heading style={{ color: '#111827', fontSize: '20px' }}>
            New Leave Request
          </Heading>
          <Text style={{ color: '#374151' }}>
            <strong>{employeeName}</strong> has submitted a leave request.
          </Text>
          <Section style={{ backgroundColor: '#f3f4f6', borderRadius: '6px', padding: '16px', margin: '16px 0' }}>
            <Text style={{ margin: '4px 0', color: '#374151' }}><strong>Type:</strong> {leaveType}</Text>
            <Text style={{ margin: '4px 0', color: '#374151' }}><strong>From:</strong> {startDate}</Text>
            <Text style={{ margin: '4px 0', color: '#374151' }}><strong>To:</strong> {endDate}</Text>
            <Text style={{ margin: '4px 0', color: '#374151' }}><strong>Duration:</strong> {totalDays} working day{totalDays !== 1 ? 's' : ''}</Text>
            {reason && <Text style={{ margin: '4px 0', color: '#374151' }}><strong>Reason:</strong> {reason}</Text>}
          </Section>
          <Button
            href={dashboardUrl}
            style={{ backgroundColor: '#2563eb', color: '#fff', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block' }}
          >
            Review Request
          </Button>
          <Hr style={{ margin: '24px 0', borderColor: '#e5e7eb' }} />
          <Text style={{ color: '#9ca3af', fontSize: '12px' }}>AwayDay — Leave Management</Text>
        </Container>
      </Body>
    </Html>
  )
}
