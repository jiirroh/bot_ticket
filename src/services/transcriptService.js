const { AttachmentBuilder } = require('discord.js');

class TranscriptService {
  /**
   * Échappe les caractères HTML dangereux
   * @param {string} str 
   * @returns {string}
   */
  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Formate le timestamp en format lisible en français
   * @param {Date|number} date 
   * @returns {string}
   */
  formatDate(date) {
    const d = new Date(date);
    return d.toLocaleString('fr-FR', {
      timeZone: 'Europe/Paris',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Récupère tous les messages d'un salon texte de façon paginée
   * @param {import('discord.js').TextChannel} channel 
   * @returns {Promise<Array>}
   */
  async fetchAllMessages(channel) {
    const messages = [];
    let lastId = null;

    while (true) {
      const options = { limit: 100 };
      if (lastId) options.before = lastId;

      const fetched = await channel.messages.fetch(options).catch(() => null);
      if (!fetched || fetched.size === 0) break;

      messages.push(...fetched.values());
      lastId = fetched.last().id;

      if (fetched.size < 100) break;
    }

    // On remet les messages dans l'ordre chronologique (du plus ancien au plus récent)
    return messages.reverse();
  }

  /**
   * Génère un transcript HTML stylé Discord
   * @param {import('discord.js').TextChannel} channel 
   * @param {object} ticket 
   * @returns {Promise<AttachmentBuilder>}
   */
  async generateHtmlTranscript(channel, ticket) {
    const messages = await this.fetchAllMessages(channel);
    const serverName = this.escapeHtml(channel.guild.name);
    const channelName = this.escapeHtml(channel.name);
    const creationDate = this.formatDate(ticket.created_at * 1000);
    const closingDate = this.formatDate(Date.now());

    let messageEntriesHtml = '';

    for (const msg of messages) {
      const authorName = this.escapeHtml(msg.author.tag || msg.author.username);
      const authorAvatar = msg.author.displayAvatarURL({ extension: 'png', size: 64 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';
      const isBot = msg.author.bot ? '<span class="bot-badge">BOT</span>' : '';
      const timeStr = this.formatDate(msg.createdAt);
      const contentHtml = this.escapeHtml(msg.cleanContent || msg.content).replace(/\n/g, '<br>');

      // Gestion des pièces jointes (images et fichiers)
      let attachmentsHtml = '';
      if (msg.attachments.size > 0) {
        attachmentsHtml += '<div class="attachments">';
        for (const att of msg.attachments.values()) {
          const isImage = att.contentType && att.contentType.startsWith('image/');
          if (isImage) {
            attachmentsHtml += `<a href="${att.url}" target="_blank"><img class="attachment-img" src="${att.url}" alt="${this.escapeHtml(att.name)}"></a>`;
          } else {
            attachmentsHtml += `<div class="attachment-file"><a href="${att.url}" target="_blank">📎 ${this.escapeHtml(att.name)} (${(att.size / 1024).toFixed(1)} Ko)</a></div>`;
          }
        }
        attachmentsHtml += '</div>';
      }

      // Gestion des embeds
      let embedsHtml = '';
      if (msg.embeds.length > 0) {
        embedsHtml += '<div class="embeds-container">';
        for (const emb of msg.embeds) {
          const embTitle = emb.title ? `<div class="embed-title">${this.escapeHtml(emb.title)}</div>` : '';
          const embDesc = emb.description ? `<div class="embed-desc">${this.escapeHtml(emb.description).replace(/\n/g, '<br>')}</div>` : '';
          const borderColor = emb.hexColor || '#5865f2';

          embedsHtml += `
            <div class="embed" style="border-left-color: ${borderColor};">
              ${embTitle}
              ${embDesc}
            </div>
          `;
        }
        embedsHtml += '</div>';
      }

      messageEntriesHtml += `
        <div class="message-row">
          <img class="avatar" src="${authorAvatar}" alt="Avatar">
          <div class="message-body">
            <div class="message-header">
              <span class="author-name">${authorName}</span>
              ${isBot}
              <span class="timestamp">${timeStr}</span>
            </div>
            <div class="message-content">${contentHtml || (attachmentsHtml || embedsHtml ? '' : '<em>Message vide</em>')}</div>
            ${attachmentsHtml}
            ${embedsHtml}
          </div>
        </div>
      `;
    }

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Transcript - #${ticket.ticket_number} (${channelName})</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #313338;
      color: #dbdee1;
      font-family: 'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 15px;
      line-height: 1.4;
      padding: 24px;
    }
    .header {
      background-color: #2b2d31;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 24px;
      border: 1px solid #1e1f22;
    }
    .header h1 {
      color: #ffffff;
      font-size: 22px;
      margin-bottom: 8px;
    }
    .header-info {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      color: #949ba4;
      font-size: 14px;
    }
    .header-info span strong {
      color: #f2f3f5;
    }
    .messages-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .message-row {
      display: flex;
      gap: 16px;
      padding: 6px 12px;
      border-radius: 4px;
      transition: background-color 0.1s ease;
    }
    .message-row:hover {
      background-color: #2e3035;
    }
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .message-body {
      display: flex;
      flex-direction: column;
      width: 100%;
    }
    .message-header {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 4px;
    }
    .author-name {
      font-weight: 600;
      color: #f2f3f5;
    }
    .bot-badge {
      background-color: #5865f2;
      color: #ffffff;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 4px;
      border-radius: 3px;
    }
    .timestamp {
      color: #949ba4;
      font-size: 12px;
    }
    .message-content {
      color: #dbdee1;
      word-break: break-word;
    }
    .attachments {
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .attachment-img {
      max-width: 450px;
      max-height: 350px;
      border-radius: 6px;
      border: 1px solid #1e1f22;
    }
    .attachment-file a {
      color: #00a8fc;
      text-decoration: none;
    }
    .attachment-file a:hover {
      text-decoration: underline;
    }
    .embeds-container {
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .embed {
      background-color: #2b2d31;
      border-left: 4px solid #5865f2;
      border-radius: 4px;
      padding: 12px 16px;
      max-width: 520px;
    }
    .embed-title {
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 6px;
    }
    .embed-desc {
      color: #dbdee1;
      font-size: 14px;
    }
    .footer {
      margin-top: 32px;
      text-align: center;
      color: #949ba4;
      font-size: 13px;
      border-top: 1px solid #3f4147;
      padding-top: 16px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Archive du ticket : ${channelName}</h1>
    <div class="header-info">
      <span><strong>Serveur :</strong> ${serverName}</span>
      <span><strong>Ticket N° :</strong> #${String(ticket.ticket_number).padStart(4, '0')}</span>
      <span><strong>Catégorie :</strong> ${this.escapeHtml(ticket.category_id)}</span>
      <span><strong>Créé le :</strong> ${creationDate}</span>
      <span><strong>Fermé le :</strong> ${closingDate}</span>
      <span><strong>Total messages :</strong> ${messages.length}</span>
    </div>
  </div>

  <div class="messages-list">
    ${messageEntriesHtml || '<div style="padding: 16px; color: #949ba4;">Aucun message dans ce salon.</div>'}
  </div>

  <div class="footer">
    Document généré automatiquement par le Bot Discord de Tickets • ${closingDate}
  </div>
</body>
</html>`;

    const buffer = Buffer.from(html, 'utf-8');
    const filename = `transcript-${channel.name}.html`;

    return new AttachmentBuilder(buffer, { name: filename });
  }
}

module.exports = new TranscriptService();
