const { 
  ChannelType, 
  PermissionFlagsBits, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ComponentType 
} = require('discord.js');

const ticketRepository = require('../db/repositories/ticketRepository');
const configRepository = require('../db/repositories/configRepository');
const embedBuilder = require('../utils/embedBuilder');
const permissionHelper = require('../utils/permissionHelper');
const cooldown = require('../utils/cooldown');
const transcriptService = require('./transcriptService');
const logService = require('./logService');
const { EMOJIS, PRIORITIES } = require('../config/constants');

class TicketService {
  /**
   * Crée un nouveau ticket après validation des contraintes
   */
  async createTicket({ interaction, categoryId, subject }) {
    const guild = interaction.guild;
    const user = interaction.user;
    const member = interaction.member;

    const guildConfig = configRepository.getGuildConfig(guild.id);

    // 1. Vérification du Cooldown anti-spam
    const cooldownKey = `create_ticket_${guild.id}_${user.id}`;
    const cdCheck = cooldown.check(cooldownKey, guildConfig.cooldown_seconds || 60);
    if (cdCheck.onCooldown) {
      return interaction.reply({
        embeds: [embedBuilder.warning(`Veuillez patienter **${cdCheck.remainingSeconds}s** avant de pouvoir ouvrir un nouveau ticket.`)],
        ephemeral: true
      });
    }

    // 2. Vérification de la limite de tickets par catégorie
    const openCount = ticketRepository.countOpenTicketsByUserAndCategory(guild.id, user.id, categoryId);
    const maxAllowed = guildConfig.max_tickets_per_category || 1;
    if (openCount >= maxAllowed) {
      // Annule le cooldown puisque l'action n'a pas abouti
      cooldown.reset(cooldownKey);
      return interaction.reply({
        embeds: [embedBuilder.error(`Vous avez déjà **${openCount}** ticket(s) ouvert(s) dans cette catégorie (limite : ${maxAllowed}).`)],
        ephemeral: true
      });
    }

    // Récupération des informations sur la catégorie
    const categoryInfo = configRepository.getTicketCategory(guild.id, categoryId) || {
      category_id: categoryId,
      label: categoryId,
      emoji: '🎫'
    };

    // Différer la réponse pour éviter l'expiration des 3 secondes Discord
    await interaction.deferReply({ ephemeral: true });

    try {
      // 3. Attribution du numéro de ticket
      const ticketNumber = ticketRepository.getNextTicketNumber(guild.id);
      const cleanUsername = user.username.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 15) || 'user';
      const channelName = `ticket-${cleanUsername}-${String(ticketNumber).padStart(4, '0')}`;

      // 4. Construction des permissions du salon
      const staffRoleIds = configRepository.getStaffRoles(guild.id);
      const permissionOverwrites = [
        {
          id: guild.id, // @everyone : Interdit de voir le salon
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: user.id, // Créateur du ticket
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks
          ]
        },
        {
          id: interaction.client.user.id, // Le bot lui-même
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks
          ]
        }
      ];

      // Autorise chaque rôle staff configuré
      for (const roleId of staffRoleIds) {
        permissionOverwrites.push({
          id: roleId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.ManageMessages
          ]
        });
      }

      // 5. Détermination de la catégorie Discord parente
      const parentCategoryId = categoryInfo.discord_category_id || guildConfig.ticket_category_id || null;

      // 6. Création du salon textuel
      const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: parentCategoryId,
        topic: `Ticket #${ticketNumber} | Créé par ${user.tag} (${user.id}) | Motif: ${subject.slice(0, 100)}`,
        permissionOverwrites: permissionOverwrites
      });

      // 7. Enregistrement en base de données
      const ticket = ticketRepository.createTicket({
        guildId: guild.id,
        channelId: channel.id,
        userId: user.id,
        categoryId: categoryId,
        ticketNumber: ticketNumber,
        subject: subject,
        priority: 'medium'
      });

      // 8. Construction du message de bienvenue et des boutons persistants
      const welcomeEmbed = embedBuilder.ticketWelcome({
        user: user,
        category: categoryInfo,
        ticketNumber: ticketNumber,
        subject: subject,
        priority: 'medium'
      });

      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`ticket_close:${ticket.id}`)
          .setLabel('Fermer')
          .setEmoji(EMOJIS.LOCK)
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`ticket_claim:${ticket.id}`)
          .setLabel('Réclamer')
          .setEmoji(EMOJIS.CLAIM)
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`ticket_add_member:${ticket.id}`)
          .setLabel('Ajouter un membre')
          .setEmoji(EMOJIS.ADD_USER)
          .setStyle(ButtonStyle.Secondary)
      );

      // Notification staff
      const staffMentions = staffRoleIds.map(id => `<@&${id}>`).join(' ');
      const pingContent = `<@${user.id}> ${staffMentions}`.trim();

      await channel.send({
        content: pingContent,
        embeds: [welcomeEmbed],
        components: [actionRow]
      });

      // 9. Envoi du log d'ouverture
      await logService.logTicketCreated({
        guild,
        ticket,
        user,
        channel,
        category: categoryInfo,
        subject
      });

      // Confirmation éphémère pour le demandeur
      await interaction.editReply({
        embeds: [embedBuilder.success(`Votre ticket a été créé dans le salon <#${channel.id}> !`)]
      });

    } catch (error) {
      console.error('Erreur lors de la création du ticket:', error);
      cooldown.reset(cooldownKey);
      await interaction.editReply({
        embeds: [embedBuilder.error('Une erreur est survenue lors de la création de votre ticket. Vérifiez les permissions du bot.')]
      });
    }
  }

  /**
   * Prise en charge (claim) d'un ticket par un membre du staff
   */
  async claimTicket(interaction, ticketId) {
    const ticket = ticketRepository.getTicketById(ticketId);
    if (!ticket) {
      return interaction.reply({
        embeds: [embedBuilder.error('Ce ticket est introuvable dans la base de données.')],
        ephemeral: true
      });
    }

    if (!permissionHelper.isStaff(interaction.member)) {
      return interaction.reply({
        embeds: [embedBuilder.error('Seuls les membres de l\'équipe staff peuvent réclamer un ticket.')],
        ephemeral: true
      });
    }

    if (ticket.claimed_by) {
      return interaction.reply({
        embeds: [embedBuilder.warning(`Ce ticket a déjà été réclamé par <@${ticket.claimed_by}>.`)],
        ephemeral: true
      });
    }

    // Mise à jour en base de données
    ticketRepository.claimTicket(interaction.channel.id, interaction.user.id);

    // Mise à jour des boutons du message initial
    try {
      const messages = await interaction.channel.messages.fetch({ limit: 10 });
      const firstBotMsg = messages.find(m => m.author.id === interaction.client.user.id && m.components.length > 0);
      if (firstBotMsg) {
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`ticket_close:${ticket.id}`)
            .setLabel('Fermer')
            .setEmoji(EMOJIS.LOCK)
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(`ticket_claimed:${ticket.id}`)
            .setLabel(`Réclamé par ${interaction.user.username}`)
            .setEmoji(EMOJIS.CLAIM)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId(`ticket_add_member:${ticket.id}`)
            .setLabel('Ajouter un membre')
            .setEmoji(EMOJIS.ADD_USER)
            .setStyle(ButtonStyle.Secondary)
        );
        await firstBotMsg.edit({ components: [row] });
      }
    } catch (e) {
      console.warn('Impossible de mettre à jour le message d\'accueil du ticket:', e.message);
    }

    await interaction.reply({
      embeds: [embedBuilder.success(`Le ticket a été pris en charge par <@${interaction.user.id}>.`)]
    });

    await logService.logTicketClaimed({
      guild: interaction.guild,
      ticket,
      channel: interaction.channel,
      staffMember: interaction.member
    });
  }

  /**
   * Demande de confirmation avant fermeture
   */
  async promptClose(interaction, ticketId) {
    const ticket = ticketRepository.getTicketById(ticketId) || ticketRepository.getTicketByChannelId(interaction.channel.id);
    if (!ticket) {
      return interaction.reply({
        embeds: [embedBuilder.error('Ce ticket n\'est pas enregistré comme un ticket actif.')],
        ephemeral: true
      });
    }

    if (!permissionHelper.canManageTicket(interaction.member, ticket)) {
      return interaction.reply({
        embeds: [embedBuilder.error('Vous n\'avez pas la permission de fermer ce ticket.')],
        ephemeral: true
      });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_close_confirm:${ticket.id}`)
        .setLabel('Confirmer la fermeture')
        .setEmoji(EMOJIS.SUCCESS)
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`ticket_close_cancel:${ticket.id}`)
        .setLabel('Annuler')
        .setEmoji(EMOJIS.ERROR)
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      embeds: [embedBuilder.closeConfirmation()],
      components: [row]
    });
  }

  /**
   * Confirmation et exécution de la fermeture
   */
  async confirmClose(interaction, ticketId) {
    const ticket = ticketRepository.getTicketById(ticketId);
    if (!ticket || ticket.status === 'closed') {
      return interaction.reply({
        embeds: [embedBuilder.warning('Ce ticket est déjà en cours de fermeture ou n\'existe plus.')],
        ephemeral: true
      });
    }

    await interaction.deferReply();

    const channel = interaction.channel;
    const guild = interaction.guild;
    const guildConfig = configRepository.getGuildConfig(guild.id);
    const delaySeconds = guildConfig.close_delay_seconds || 5;

    try {
      // 1. Génération du transcript HTML
      const transcriptAttachment = await transcriptService.generateHtmlTranscript(channel, ticket);

      // Calcul de la durée
      const durationSeconds = Math.floor(Date.now() / 1000) - ticket.created_at;
      const durationMinutes = Math.floor(durationSeconds / 60);
      const durationHours = Math.floor(durationMinutes / 60);
      let durationStr = `${durationSeconds % 60}s`;
      if (durationMinutes > 0) durationStr = `${durationMinutes % 60}m ` + durationStr;
      if (durationHours > 0) durationStr = `${durationHours}h ` + durationStr;

      // 2. Clôture en base de données
      ticketRepository.closeTicket(channel.id, interaction.user.id);

      // 3. Envoi du log dans le salon de log
      await logService.logTicketClosed({
        guild,
        ticket,
        channelName: channel.name,
        closedBy: interaction.user,
        attachment: transcriptAttachment,
        durationStr
      });

      // 4. Envoi du transcript en MP au créateur du ticket
      try {
        const ticketCreator = await guild.members.fetch(ticket.user_id).catch(() => null);
        if (ticketCreator) {
          const userDmEmbed = embedBuilder.info(
            `Votre ticket **#${String(ticket.ticket_number).padStart(4, '0')}** sur le serveur **${guild.name}** a été fermé par <@${interaction.user.id}>.\n` +
            `Vous trouverez le transcript complet des échanges en pièce jointe.`
          );
          await ticketCreator.send({
            embeds: [userDmEmbed],
            files: [transcriptAttachment]
          }).catch(() => null); // Ignore silencieusement si les MPs sont bloqués
        }
      } catch (dmErr) {
        console.warn('Impossible d\'envoyer le transcript en MP:', dmErr.message);
      }

      // 5. Compte à rebours avant suppression
      await interaction.editReply({
        embeds: [embedBuilder.warning(`Le ticket sera définitivement supprimé dans **${delaySeconds}** seconde(s)...`)]
      });

      setTimeout(async () => {
        try {
          await channel.delete(`Fermé par ${interaction.user.tag}`);
        } catch (err) {
          console.error('Erreur lors de la suppression du salon:', err);
        }
      }, delaySeconds * 1000);

    } catch (err) {
      console.error('Erreur lors de la fermeture du ticket:', err);
      await interaction.editReply({
        embeds: [embedBuilder.error('Une erreur est survenue lors de la fermeture du ticket.')]
      });
    }
  }

  /**
   * Annulation de la fermeture
   */
  async cancelClose(interaction) {
    await interaction.update({
      embeds: [embedBuilder.info('La fermeture du ticket a été annulée.')],
      components: []
    });
  }

  /**
   * Ajoute un utilisateur dans le salon de ticket
   */
  async addMember(interaction, targetUser) {
    const channel = interaction.channel;
    const ticket = ticketRepository.getTicketByChannelId(channel.id);

    if (!ticket) {
      return interaction.reply({
        embeds: [embedBuilder.error('Cette commande ne peut être exécutée que dans un salon de ticket actif.')],
        ephemeral: true
      });
    }

    if (!permissionHelper.isStaff(interaction.member)) {
      return interaction.reply({
        embeds: [embedBuilder.error('Seuls les membres du staff peuvent ajouter des utilisateurs.')],
        ephemeral: true
      });
    }

    await channel.permissionOverwrites.edit(targetUser.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
      AttachFiles: true,
      EmbedLinks: true
    });

    await interaction.reply({
      embeds: [embedBuilder.success(`<@${targetUser.id}> a été ajouté au ticket avec succès.`)]
    });

    await logService.logMemberAdded({
      guild: interaction.guild,
      ticket,
      channel,
      staffMember: interaction.member,
      targetMember: targetUser
    });
  }

  /**
   * Retire un utilisateur du salon de ticket
   */
  async removeMember(interaction, targetUser) {
    const channel = interaction.channel;
    const ticket = ticketRepository.getTicketByChannelId(channel.id);

    if (!ticket) {
      return interaction.reply({
        embeds: [embedBuilder.error('Cette commande ne peut être exécutée que dans un salon de ticket actif.')],
        ephemeral: true
      });
    }

    if (!permissionHelper.isStaff(interaction.member)) {
      return interaction.reply({
        embeds: [embedBuilder.error('Seuls les membres du staff peuvent retirer des utilisateurs.')],
        ephemeral: true
      });
    }

    if (targetUser.id === ticket.user_id) {
      return interaction.reply({
        embeds: [embedBuilder.error('Vous ne pouvez pas retirer le créateur initial du ticket.')],
        ephemeral: true
      });
    }

    await channel.permissionOverwrites.delete(targetUser.id).catch(async () => {
      await channel.permissionOverwrites.edit(targetUser.id, { ViewChannel: false });
    });

    await interaction.reply({
      embeds: [embedBuilder.success(`<@${targetUser.id}> a été retiré du ticket.`)]
    });

    await logService.logMemberRemoved({
      guild: interaction.guild,
      ticket,
      channel,
      staffMember: interaction.member,
      targetMember: targetUser
    });
  }

  /**
   * Renomme le salon de ticket
   */
  async renameTicket(interaction, newName) {
    const channel = interaction.channel;
    const ticket = ticketRepository.getTicketByChannelId(channel.id);

    if (!ticket) {
      return interaction.reply({
        embeds: [embedBuilder.error('Cette commande ne peut être exécutée que dans un salon de ticket actif.')],
        ephemeral: true
      });
    }

    if (!permissionHelper.isStaff(interaction.member)) {
      return interaction.reply({
        embeds: [embedBuilder.error('Seuls les membres du staff peuvent renommer un ticket.')],
        ephemeral: true
      });
    }

    const cleanName = newName.toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 30);
    await channel.setName(cleanName);

    await interaction.reply({
      embeds: [embedBuilder.success(`Le salon a été renommé en **${cleanName}**.`)]
    });
  }

  /**
   * Modifie la priorité d'un ticket
   */
  async setPriority(interaction, priority) {
    const channel = interaction.channel;
    const ticket = ticketRepository.getTicketByChannelId(channel.id);

    if (!ticket) {
      return interaction.reply({
        embeds: [embedBuilder.error('Cette commande ne peut être exécutée que dans un salon de ticket actif.')],
        ephemeral: true
      });
    }

    if (!permissionHelper.isStaff(interaction.member)) {
      return interaction.reply({
        embeds: [embedBuilder.error('Seuls les membres du staff peuvent modifier la priorité.')],
        ephemeral: true
      });
    }

    const prioConfig = Object.values(PRIORITIES).find(p => p.id === priority);
    if (!prioConfig) {
      return interaction.reply({
        embeds: [embedBuilder.error('Niveau de priorité invalide.')],
        ephemeral: true
      });
    }

    const oldPriority = ticket.priority;
    ticketRepository.updatePriority(channel.id, priority);

    await interaction.reply({
      embeds: [embedBuilder.success(`La priorité du ticket a été définie sur **${prioConfig.emoji} ${prioConfig.label}**.`)]
    });

    await logService.logPriorityChanged({
      guild: interaction.guild,
      ticket,
      channel,
      staffMember: interaction.member,
      oldPriority,
      newPriority: priority
    });
  }
}

module.exports = new TicketService();
