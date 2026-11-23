const { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  ChannelType, 
  EmbedBuilder 
} = require('discord.js');

const configRepository = require('../db/repositories/configRepository');
const embedBuilder = require('../utils/embedBuilder');
const { COLORS, EMOJIS } = require('../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configuration du système de tickets (Administrateurs & Staff)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub
        .setName('servers')
        .setDescription('Lister tous les serveurs connectés au bot et leurs identifiants')
    )
    .addSubcommand(sub =>
      sub
        .setName('view')
        .setDescription('Afficher la configuration actuelle d\'un serveur')
        .addStringOption(opt =>
          opt
            .setName('serveur_id')
            .setDescription('ID du serveur cible (laisser vide pour le serveur actuel)')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('logs')
        .setDescription('Définir le salon de logs (peut être sur le serveur staff pour un autre serveur)')
        .addChannelOption(opt =>
          opt
            .setName('salon')
            .setDescription('Le salon textuel où envoyer les logs')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt
            .setName('salon_id')
            .setDescription('ID direct du salon de log (utile si situé sur un autre serveur)')
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt
            .setName('serveur_id')
            .setDescription('ID du serveur dont on configure les logs (laisser vide pour le serveur actuel)')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('category')
        .setDescription('Définir la catégorie Discord par défaut où créer les tickets')
        .addChannelOption(opt =>
          opt
            .setName('categorie')
            .setDescription('La catégorie Discord parente')
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt
            .setName('categorie_id')
            .setDescription('ID de la catégorie (utile si configuration à distance)')
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt
            .setName('serveur_id')
            .setDescription('ID du serveur cible (laisser vide pour le serveur actuel)')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('staff-role')
        .setDescription('Gérer les rôles autorisés comme Staff')
        .addStringOption(opt =>
          opt
            .setName('action')
            .setDescription('Ajouter ou retirer un rôle')
            .setRequired(true)
            .addChoices(
              { name: 'Ajouter', value: 'add' },
              { name: 'Retirer', value: 'remove' }
            )
        )
        .addRoleOption(opt =>
          opt
            .setName('role')
            .setDescription('Le rôle staff concerné')
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt
            .setName('role_id')
            .setDescription('ID direct du rôle (utile si configuration à distance)')
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt
            .setName('serveur_id')
            .setDescription('ID du serveur cible (laisser vide pour le serveur actuel)')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('ticket-types')
        .setDescription('Gérer les types de tickets disponibles')
        .addStringOption(opt =>
          opt
            .setName('action')
            .setDescription('Action à effectuer')
            .setRequired(true)
            .addChoices(
              { name: 'Lister les types', value: 'list' },
              { name: 'Ajouter / Modifier', value: 'add' },
              { name: 'Supprimer', value: 'remove' }
            )
        )
        .addStringOption(opt =>
          opt
            .setName('id')
            .setDescription('Identifiant unique (ex: support, devis, recrutement)')
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt
            .setName('nom')
            .setDescription('Titre affiché (ex: Support Général)')
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt
            .setName('description')
            .setDescription('Brève description affichée dans le menu')
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt
            .setName('emoji')
            .setDescription('Emoji pour le menu (ex: 💡, 🛡️)')
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt
            .setName('serveur_id')
            .setDescription('ID du serveur cible (laisser vide pour le serveur actuel)')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('delay')
        .setDescription('Délai en secondes avant suppression du salon après fermeture')
        .addIntegerOption(opt =>
          opt
            .setName('secondes')
            .setDescription('Durée (entre 0 et 60 secondes)')
            .setMinValue(0)
            .setMaxValue(60)
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt
            .setName('serveur_id')
            .setDescription('ID du serveur cible (laisser vide pour le serveur actuel)')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('limit')
        .setDescription('Nombre maximum de tickets ouverts par utilisateur et par catégorie')
        .addIntegerOption(opt =>
          opt
            .setName('nombre')
            .setDescription('Limite (ex: 1, 2, 3)')
            .setMinValue(1)
            .setMaxValue(10)
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt
            .setName('serveur_id')
            .setDescription('ID du serveur cible (laisser vide pour le serveur actuel)')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('cooldown')
        .setDescription('Temps d\'attente anti-spam entre deux créations de tickets')
        .addIntegerOption(opt =>
          opt
            .setName('secondes')
            .setDescription('Durée du cooldown en secondes')
            .setMinValue(0)
            .setMaxValue(3600)
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt
            .setName('serveur_id')
            .setDescription('ID du serveur cible (laisser vide pour le serveur actuel)')
            .setRequired(false)
        )
    ),

  /**
   * Résout le serveur cible (soit serveur_id passé en paramètre, soit le serveur où la commande est exécutée)
   */
  async resolveTargetGuild(interaction) {
    const customGuildId = interaction.options.getString('serveur_id');
    if (!customGuildId) {
      return { guildId: interaction.guild.id, guildName: interaction.guild.name };
    }

    const cleanId = customGuildId.trim();
    const fetchedGuild = await interaction.client.guilds.fetch(cleanId).catch(() => null);
    if (!fetchedGuild) {
      return { 
        guildId: cleanId, 
        guildName: `Serveur inconnu ou non partagé (${cleanId})`, 
        error: `Le bot ne se trouve pas sur le serveur ayant pour identifiant \`${cleanId}\`.` 
      };
    }
    return { guildId: fetchedGuild.id, guildName: fetchedGuild.name };
  },

  /**
   * Exécution de la commande /config
   */
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    // 1. Lister tous les serveurs du bot
    if (subcommand === 'servers') {
      const guilds = interaction.client.guilds.cache;
      const list = guilds.map(g => `• **${g.name}**\n  - ID : \`${g.id}\`\n  - Membres : ${g.memberCount}`).join('\n\n');

      const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle(`🌐 Serveurs connectés au bot (${guilds.size})`)
        .setDescription(list || 'Aucun serveur détecté.')
        .setFooter({ text: 'Copiez un ID pour le renseigner dans l\'option serveur_id de /config' });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Résolution du serveur cible
    const { guildId, guildName, error } = await this.resolveTargetGuild(interaction);
    if (error) {
      return interaction.reply({
        embeds: [embedBuilder.error(error)],
        ephemeral: true
      });
    }

    switch (subcommand) {
      case 'view': {
        const config = configRepository.getGuildConfig(guildId);
        const staffRoles = configRepository.getStaffRoles(guildId);
        const categories = configRepository.getTicketCategories(guildId);

        const staffRolesList = staffRoles.length > 0 
          ? staffRoles.map(id => `<@&${id}> (\`${id}\`)`).join(', ') 
          : '*Aucun rôle configuré (Administrateurs uniquement)*';

        const categoriesList = categories.length > 0
          ? categories.map(c => `• **${c.emoji || '📁'} ${c.label}** (\`${c.category_id}\`): ${c.description || 'Sans description'}`).join('\n')
          : '*Aucune catégorie active*';

        const embed = new EmbedBuilder()
          .setColor(COLORS.PRIMARY)
          .setTitle(`${EMOJIS.SETTINGS} Configuration des Tickets - ${guildName}`)
          .setDescription(`Identifiant du serveur : \`${guildId}\``)
          .addFields(
            { name: '📜 Salon de logs', value: config.log_channel_id ? `<#${config.log_channel_id}> (\`${config.log_channel_id}\`)` : '*Non configuré*', inline: true },
            { name: '📂 Catégorie Discord', value: config.ticket_category_id ? `<#${config.ticket_category_id}> (\`${config.ticket_category_id}\`)` : '*Racine du serveur*', inline: true },
            { name: '⏱️ Délai de suppression', value: `${config.close_delay_seconds || 5} seconde(s)`, inline: true },
            { name: '🛑 Limite par catégorie', value: `${config.max_tickets_per_category || 1} ticket(s) max`, inline: true },
            { name: '⏳ Cooldown anti-spam', value: `${config.cooldown_seconds || 60} seconde(s)`, inline: true },
            { name: '🛡️ Rôles Staff autorisés', value: staffRolesList, inline: false },
            { name: '🗂️ Types de tickets configurés', value: categoriesList, inline: false }
          )
          .setFooter({ text: 'Utilisez /config <paramètre> serveur_id:<id> pour modifier ces valeurs.' })
          .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      case 'logs': {
        const channelOption = interaction.options.getChannel('salon');
        const channelIdOption = interaction.options.getString('salon_id');

        const resolvedChannelId = channelOption ? channelOption.id : (channelIdOption ? channelIdOption.trim() : null);

        if (!resolvedChannelId) {
          return interaction.reply({
            embeds: [embedBuilder.error('Veuillez spécifier soit un salon via `salon`, soit un identifiant via `salon_id`.')],
            ephemeral: true
          });
        }

        // Vérification que le bot a accès à ce salon
        const channelObj = await interaction.client.channels.fetch(resolvedChannelId).catch(() => null);
        if (!channelObj || !channelObj.isTextBased()) {
          return interaction.reply({
            embeds: [embedBuilder.error(`Le bot n'a pas accès au salon \`${resolvedChannelId}\` ou ce n'est pas un salon textuel.`)],
            ephemeral: true
          });
        }

        configRepository.updateGuildConfig(guildId, { log_channel_id: resolvedChannelId });
        return interaction.reply({
          embeds: [embedBuilder.success(`Le salon de logs pour **${guildName}** a été défini sur <#${resolvedChannelId}> (Serveur : **${channelObj.guild.name}**).`)],
          ephemeral: true
        });
      }

      case 'category': {
        const categoryChannel = interaction.options.getChannel('categorie');
        const categoryIdOption = interaction.options.getString('categorie_id');
        const targetCategoryId = categoryChannel ? categoryChannel.id : (categoryIdOption ? categoryIdOption.trim() : null);

        if (!targetCategoryId) {
          return interaction.reply({
            embeds: [embedBuilder.error('Veuillez spécifier une catégorie via `categorie` ou `categorie_id`.')],
            ephemeral: true
          });
        }

        configRepository.updateGuildConfig(guildId, { ticket_category_id: targetCategoryId });
        return interaction.reply({
          embeds: [embedBuilder.success(`La catégorie par défaut pour les tickets de **${guildName}** a été définie sur l'ID \`${targetCategoryId}\`.`)],
          ephemeral: true
        });
      }

      case 'staff-role': {
        const action = interaction.options.getString('action');
        const role = interaction.options.getRole('role');
        const roleIdOption = interaction.options.getString('role_id');
        const targetRoleId = role ? role.id : (roleIdOption ? roleIdOption.trim() : null);

        if (!targetRoleId) {
          return interaction.reply({
            embeds: [embedBuilder.error('Veuillez spécifier un rôle via `role` ou `role_id`.')],
            ephemeral: true
          });
        }

        if (action === 'add') {
          configRepository.addStaffRole(guildId, targetRoleId);
          return interaction.reply({
            embeds: [embedBuilder.success(`Le rôle \`${targetRoleId}\` a été ajouté au staff de **${guildName}**.`)],
            ephemeral: true
          });
        } else {
          configRepository.removeStaffRole(guildId, targetRoleId);
          return interaction.reply({
            embeds: [embedBuilder.success(`Le rôle \`${targetRoleId}\` a été retiré du staff de **${guildName}**.`)],
            ephemeral: true
          });
        }
      }

      case 'ticket-types': {
        const action = interaction.options.getString('action');
        const id = interaction.options.getString('id');
        const nom = interaction.options.getString('nom');
        const description = interaction.options.getString('description');
        const emoji = interaction.options.getString('emoji');

        if (action === 'list') {
          const categories = configRepository.getTicketCategories(guildId);
          const listText = categories.map(c => `• **${c.emoji || '📁'} ${c.label}** (\`${c.category_id}\`)\n  _${c.description || 'Pas de description'}_`).join('\n\n');
          return interaction.reply({
            embeds: [embedBuilder.info(`**Types de tickets existants sur ${guildName} :**\n\n${listText}`)],
            ephemeral: true
          });
        }

        if (action === 'add') {
          if (!id || !nom) {
            return interaction.reply({
              embeds: [embedBuilder.error('Vous devez spécifier au minimum un identifiant (`id`) et un nom (`nom`).')],
              ephemeral: true
            });
          }

          const cleanId = id.toLowerCase().replace(/[^a-z0-9_-]/g, '');
          configRepository.upsertTicketCategory(guildId, {
            categoryId: cleanId,
            label: nom,
            description: description || '',
            emoji: emoji || '🎫'
          });

          return interaction.reply({
            embeds: [embedBuilder.success(`La catégorie **${nom}** (\`${cleanId}\`) a été enregistrée pour **${guildName}**.`)],
            ephemeral: true
          });
        }

        if (action === 'remove') {
          if (!id) {
            return interaction.reply({
              embeds: [embedBuilder.error('Veuillez spécifier l\'identifiant (`id`) de la catégorie à supprimer.')],
              ephemeral: true
            });
          }

          configRepository.removeTicketCategory(guildId, id.toLowerCase());
          return interaction.reply({
            embeds: [embedBuilder.success(`La catégorie de ticket \`${id}\` a été supprimée de **${guildName}**.`)],
            ephemeral: true
          });
        }
        break;
      }

      case 'delay': {
        const delay = interaction.options.getInteger('secondes');
        configRepository.updateGuildConfig(guildId, { close_delay_seconds: delay });
        return interaction.reply({
          embeds: [embedBuilder.success(`Le délai de suppression pour **${guildName}** a été réglé à **${delay} seconde(s)**.`)],
          ephemeral: true
        });
      }

      case 'limit': {
        const limit = interaction.options.getInteger('nombre');
        configRepository.updateGuildConfig(guildId, { max_tickets_per_category: limit });
        return interaction.reply({
          embeds: [embedBuilder.success(`La limite pour **${guildName}** a été définie sur **${limit} ticket(s)** par membre.`)],
          ephemeral: true
        });
      }

      case 'cooldown': {
        const cooldownVal = interaction.options.getInteger('secondes');
        configRepository.updateGuildConfig(guildId, { cooldown_seconds: cooldownVal });
        return interaction.reply({
          embeds: [embedBuilder.success(`Le cooldown anti-spam pour **${guildName}** a été défini sur **${cooldownVal} seconde(s)**.`)],
          ephemeral: true
        });
      }
    }
  }
};
