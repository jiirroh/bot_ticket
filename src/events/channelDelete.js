const ticketRepository = require('../db/repositories/ticketRepository');

module.exports = {
  name: 'channelDelete',
  async execute(channel) {
    // Si un salon de ticket est supprimé manuellement, met à jour le statut en base
    const ticket = ticketRepository.getTicketByChannelId(channel.id);
    if (ticket && ticket.status === 'open') {
      ticketRepository.closeTicket(channel.id, 'MANUAL_DELETION');
      console.log(`[DB] Salon ${channel.name} (${channel.id}) supprimé manuellement : Ticket #${ticket.ticket_number} marqué fermé.`);
    }
  }
};
