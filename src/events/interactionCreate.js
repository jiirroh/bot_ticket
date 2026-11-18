const { 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  UserSelectMenuBuilder,
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle 
} = require('discord.js');

const configRepository = require('../db/repositories/configRepository');
const ticketService = require('../services/ticketService');
const embedBuilder = require('../utils/embedBuilder');
const { EMOJIS } = require('../config/constants');

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

      // 3. GESTION DES MENUS DÉROULANTS (SELECT MENUS)
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

      // 4. GESTION DE LA SÉLECTION D'UTILISATEUR (USER SELECT)
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

      // 5. GESTION DES MODALS
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
