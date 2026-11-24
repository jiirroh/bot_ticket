const { 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  UserSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  ChannelType,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle 
} = require('discord.js');

const configRepository = require('../db/repositories/configRepository');
const ticketService = require('../services/ticketService');
const embedBuilder = require('../utils/embedBuilder');
const { EMOJIS } = require('../config/constants');
const { buildSetupDashboard } = require('../commands/setup');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    try {
      // 1. GESTION DES COMMANDES SLASH
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
          await command.execute(interaction);
        } catch (cmdError) {
          console.error(`Erreur commande /${interaction.commandName}:`, cmdError);
          const replyMethod = (interaction.deferred || interaction.replied) ? 'editReply' : 'reply';
          await interaction[replyMethod]({
            embeds: [embedBuilder.error('Une erreur est survenue lors de l\'exécution de cette commande.')],
            ephemeral: true
          }).catch(() => null);
        }
        return;
      }

      // 2. GESTION DES BOUTONS
      if (interaction.isButton()) {
        const customId = interaction.customId;

        // --- BOUTONS DU DASHBOARD /SETUP ---
        if (customId === 'setup_btn_logs') {
          const row = new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder()
              .setCustomId('setup_select_logs')
              .setPlaceholder('Sélectionnez le salon textuel pour les logs...')
              .setChannelTypes(ChannelType.GuildText)
          );
          return interaction.reply({
            content: 'Choisissez le salon où vous souhaitez recevoir tous les logs de tickets :',
            components: [row],
            ephemeral: true
          });
        }

        if (customId === 'setup_btn_category') {
          const row = new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder()
              .setCustomId('setup_select_category')
              .setPlaceholder('Sélectionnez la catégorie Discord pour les tickets...')
              .setChannelTypes(ChannelType.GuildCategory)
          );
          return interaction.reply({
            content: 'Choisissez la catégorie Discord sous laquelle seront créés les salons de tickets :',
            components: [row],
            ephemeral: true
          });
        }

        if (customId === 'setup_btn_staff') {
          const row = new ActionRowBuilder().addComponents(
            new RoleSelectMenuBuilder()
              .setCustomId('setup_select_staff_role')
              .setPlaceholder('Sélectionnez le ou les rôles Staff...')
              .setMinValues(1)
              .setMaxValues(5)
          );
          return interaction.reply({
            content: 'Sélectionnez les rôles autorisés à gérer les tickets (claim, fermer, commandes staff) :',
            components: [row],
            ephemeral: true
          });
        }

        if (customId === 'setup_btn_panel') {
          const row = new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder()
              .setCustomId('setup_select_panel_channel')
              .setPlaceholder('Sélectionnez le salon où poster le panneau...')
              .setChannelTypes(ChannelType.GuildText)
          );
          return interaction.reply({
            content: 'Dans quel salon souhaitez-vous déployer le panneau "Ouvrir un ticket" ?',
            components: [row],
            ephemeral: true
          });
        }

        if (customId === 'setup_btn_refresh') {
          const dashboard = buildSetupDashboard(interaction.guild);
          return interaction.update({
            ...dashboard
          });
        }

        // --- GESTION DU SYSTÈME DE TICKETS ---
        // Clic sur "Ouvrir un ticket" -> Proposer le menu des catégories
        if (customId === 'ticket_create_btn') {
          const categories = configRepository.getTicketCategories(interaction.guild.id);
          if (!categories || categories.length === 0) {
            return interaction.reply({
              embeds: [embedBuilder.error('Aucune catégorie de ticket n\'est configurée sur ce serveur.')],
              ephemeral: true
            });
          }

          const options = categories.slice(0, 25).map(cat => ({
            label: cat.label.slice(0, 100),
            description: (cat.description || '').slice(0, 100) || undefined,
            value: cat.category_id,
            emoji: cat.emoji || '🎫'
          }));

          const selectRow = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId('ticket_category_select')
              .setPlaceholder('Choisissez le motif / type de votre demande...')
              .addOptions(options)
          );

          return interaction.reply({
            content: 'Veuillez sélectionner le type de ticket correspondant à votre demande :',
            components: [selectRow],
            ephemeral: true
          });
        }

        // Clic sur "Fermer"
        if (customId.startsWith('ticket_close:')) {
          const ticketId = parseInt(customId.split(':')[1], 10);
          return ticketService.promptClose(interaction, ticketId);
        }

        // Clic sur "Confirmer la fermeture"
        if (customId.startsWith('ticket_close_confirm:')) {
          const ticketId = parseInt(customId.split(':')[1], 10);
          return ticketService.confirmClose(interaction, ticketId);
        }

        // Clic sur "Annuler"
        if (customId.startsWith('ticket_close_cancel:')) {
          return ticketService.cancelClose(interaction);
        }

        // Clic sur "Réclamer"
        if (customId.startsWith('ticket_claim:')) {
          const ticketId = parseInt(customId.split(':')[1], 10);
          return ticketService.claimTicket(interaction, ticketId);
        }

        // Clic sur "Ajouter un membre"
        if (customId.startsWith('ticket_add_member:')) {
          const ticketId = customId.split(':')[1];
          const userSelectRow = new ActionRowBuilder().addComponents(
            new UserSelectMenuBuilder()
              .setCustomId(`ticket_user_select:${ticketId}`)
              .setPlaceholder('Sélectionnez un membre à inviter dans ce salon')
          );

          return interaction.reply({
            content: 'Choisissez l\'utilisateur que vous souhaitez ajouter au ticket :',
            components: [userSelectRow],
            ephemeral: true
          });
        }
      }

      // 3. GESTION DES MENUS DÉROULANTS DE CANAUX (CHANNEL SELECT)
      if (interaction.isChannelSelectMenu()) {
        const guildId = interaction.guild.id;

        // Configuration du salon de logs via /setup
        if (interaction.customId === 'setup_select_logs') {
          const channelId = interaction.values[0];
          configRepository.updateGuildConfig(guildId, { log_channel_id: channelId });
          return interaction.update({
            content: `✅ Le salon de logs a été défini sur <#${channelId}> avec succès !\nUtilisez le bouton **Actualiser** sur le panneau pour voir le changement.`,
            components: []
          });
        }

        // Configuration de la catégorie de tickets via /setup
        if (interaction.customId === 'setup_select_category') {
          const categoryId = interaction.values[0];
          configRepository.updateGuildConfig(guildId, { ticket_category_id: categoryId });
          return interaction.update({
            content: `✅ La catégorie parente pour les tickets a été définie sur <#${categoryId}> !\nUtilisez le bouton **Actualiser** sur le panneau pour voir le changement.`,
            components: []
          });
        }

        // Déploiement automatique du panneau dans le salon choisi
        if (interaction.customId === 'setup_select_panel_channel') {
          const channelId = interaction.values[0];
          const targetChannel = await interaction.guild.channels.fetch(channelId).catch(() => null);

          if (!targetChannel || !targetChannel.isTextBased()) {
            return interaction.update({
              content: '❌ Salon invalide ou introuvable.',
              components: []
            });
          }

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('ticket_create_btn')
              .setLabel('Ouvrir un ticket')
              .setEmoji(EMOJIS.TICKET)
              .setStyle(ButtonStyle.Primary)
          );

          const panelEmbed = embedBuilder.panel(interaction.guild.name);
          await targetChannel.send({
            embeds: [panelEmbed],
            components: [row]
          });

          return interaction.update({
            content: `🎉 Le panneau d'assistance a été posté dans <#${channelId}> avec succès !`,
            components: []
          });
        }
      }

      // 4. GESTION DES MENUS DÉROULANTS DE RÔLES (ROLE SELECT)
      if (interaction.isRoleSelectMenu()) {
        if (interaction.customId === 'setup_select_staff_role') {
          const selectedRoles = interaction.values;
          for (const roleId of selectedRoles) {
            configRepository.addStaffRole(interaction.guild.id, roleId);
          }
          const rolesText = selectedRoles.map(id => `<@&${id}>`).join(', ');
          return interaction.update({
            content: `✅ Rôle(s) Staff ajouté(s) : ${rolesText}\nUtilisez le bouton **Actualiser** sur le panneau pour voir le changement.`,
            components: []
          });
        }
      }

      // 5. GESTION DES MENUS STRING SELECT (TYPES DE TICKETS)
      if (interaction.isStringSelectMenu()) {
        // Choix de la catégorie -> Ouverture du formulaire Modal pour le motif
        if (interaction.customId === 'ticket_category_select') {
          const selectedCategory = interaction.values[0];
          const categoryInfo = configRepository.getTicketCategory(interaction.guild.id, selectedCategory);

          const modal = new ModalBuilder()
            .setCustomId(`ticket_modal:${selectedCategory}`)
            .setTitle(`Nouveau Ticket : ${(categoryInfo ? categoryInfo.label : selectedCategory).slice(0, 30)}`);

          const subjectInput = new TextInputBuilder()
            .setCustomId('ticket_subject')
            .setLabel('Sujet court de votre demande')
            .setPlaceholder('Ex : Problème de connexion, Question sur mon grade...')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(100)
            .setRequired(true);

          const descriptionInput = new TextInputBuilder()
            .setCustomId('ticket_description')
            .setLabel('Description détaillée')
            .setPlaceholder('Expliquez votre problème avec le plus de précisions possible...')
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(1000)
            .setRequired(true);

          modal.addComponents(
            new ActionRowBuilder().addComponents(subjectInput),
            new ActionRowBuilder().addComponents(descriptionInput)
          );

          return interaction.showModal(modal);
        }
      }

      // 6. GESTION DE LA SÉLECTION D'UTILISATEUR (USER SELECT)
      if (interaction.isUserSelectMenu()) {
        if (interaction.customId.startsWith('ticket_user_select:')) {
          const targetUserId = interaction.values[0];
          const targetUser = await interaction.guild.members.fetch(targetUserId).catch(() => null);

          if (!targetUser) {
            return interaction.reply({
              embeds: [embedBuilder.error('Membre introuvable sur ce serveur.')],
              ephemeral: true
            });
          }

          return ticketService.addMember(interaction, targetUser.user);
        }
      }

      // 7. GESTION DES MODALS
      if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith('ticket_modal:')) {
          const categoryId = interaction.customId.split(':')[1];
          const subject = interaction.fields.getTextInputValue('ticket_subject');
          const description = interaction.fields.getTextInputValue('ticket_description');

          const fullSubject = `${subject}\n\n${description}`;

          return ticketService.createTicket({
            interaction,
            categoryId,
            subject: fullSubject
          });
        }
      }

    } catch (globalError) {
      console.error('Erreur non capturée dans interactionCreate:', globalError);
      if (interaction.isRepliable() && !interaction.replied) {
        const replyMethod = interaction.deferred ? 'editReply' : 'reply';
        await interaction[replyMethod]({
          embeds: [embedBuilder.error('Une erreur inattendue est survenue.')],
          ephemeral: true
        }).catch(() => null);
      }
    }
  }
};
