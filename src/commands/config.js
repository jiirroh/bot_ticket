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
    .setDescription('Configuration du système de tickets (Administrateurs)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub
        .setName('view')
        .setDescription('Afficher la configuration actuelle du serveur')
    )
    .addSubcommand(sub =>
      sub
        .setName('logs')
        .setDescription('Définir le salon où seront envoyés les logs de tickets')
        .addChannelOption(opt =>
          opt
            .setName('salon')
            .setDescription('Le salon textuel de logs')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
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
            .setRequired(true)
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
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('ticket-types')
        .setDescription('Gérer les catégories/types de tickets disponibles pour les membres')
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
    ),

  /**
   * Exécution de la commande /config
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   */
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    switch (subcommand) {
      case 'view': {
        const config = configRepository.getGuildConfig(guildId);
        const staffRoles = configRepository.getStaffRoles(guildId);
        const categories = configRepository.getTicketCategories(guildId);

        const staffRolesList = staffRoles.length > 0 
          ? staffRoles.map(id => `<@&${id}>`).join(', ') 
          : '*Aucun rôle configuré (Administrateurs uniquement)*';

        const categoriesList = categories.length > 0
          ? categories.map(c => `• **${c.emoji || '📁'} ${c.label}** (\`${c.category_id}\`): ${c.description || 'Sans description'}`).join('\n')
          : '*Aucune catégorie active*';

        const embed = new EmbedBuilder()
          .setColor(COLORS.PRIMARY)
          .setTitle(`${EMOJIS.SETTINGS} Configuration des Tickets - ${interaction.guild.name}`)
          .addFields(
            { name: '📜 Salon de logs', value: config.log_channel_id ? `<#${config.log_channel_id}>` : '*Non configuré*', inline: true },
            { name: '📂 Catégorie Discord', value: config.ticket_category_id ? `<#${config.ticket_category_id}>` : '*Racine du serveur*', inline: true },
            { name: '⏱️ Délai de suppression', value: `${config.close_delay_seconds || 5} seconde(s)`, inline: true },
            { name: '🛑 Limite par catégorie', value: `${config.max_tickets_per_category || 1} ticket(s) max`, inline: true },
            { name: '⏳ Cooldown anti-spam', value: `${config.cooldown_seconds || 60} seconde(s)`, inline: true },
            { name: '🛡️ Rôles Staff autorisés', value: staffRolesList, inline: false },
            { name: '🗂️ Types de tickets configurés', value: categoriesList, inline: false }
          )
          .setFooter({ text: 'Utilisez /config <paramètre> pour modifier ces valeurs.' })
          .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      case 'logs': {
        const channel = interaction.options.getChannel('salon');
        configRepository.updateGuildConfig(guildId, { log_channel_id: channel.id });
        return interaction.reply({
          embeds: [embedBuilder.success(`Le salon de logs a été défini sur <#${channel.id}>.`)],
          ephemeral: true
        });
      }

      case 'category': {
        const categoryChannel = interaction.options.getChannel('categorie');
        configRepository.updateGuildConfig(guildId, { ticket_category_id: categoryChannel.id });
        return interaction.reply({
          embeds: [embedBuilder.success(`La catégorie par défaut pour les tickets a été définie sur **${categoryChannel.name}**.`)],
          ephemeral: true
        });
      }

      case 'staff-role': {
        const action = interaction.options.getString('action');
        const role = interaction.options.getRole('role');

        if (action === 'add') {
          configRepository.addStaffRole(guildId, role.id);
          return interaction.reply({
            embeds: [embedBuilder.success(`Le rôle <@&${role.id}> a été ajouté à l'équipe Staff.`)],
            ephemeral: true
          });
        } else {
          configRepository.removeStaffRole(guildId, role.id);
          return interaction.reply({
            embeds: [embedBuilder.success(`Le rôle <@&${role.id}> a été retiré de l'équipe Staff.`)],
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
            embeds: [embedBuilder.info(`**Types de tickets existants :**\n\n${listText}`)],
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
            embeds: [embedBuilder.success(`La catégorie **${nom}** (\`${cleanId}\`) a été enregistrée avec succès.`)],
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
            embeds: [embedBuilder.success(`La catégorie de ticket \`${id}\` a été supprimée.`)],
            ephemeral: true
          });
        }
        break;
      }

      case 'delay': {
        const delay = interaction.options.getInteger('secondes');
        configRepository.updateGuildConfig(guildId, { close_delay_seconds: delay });
        return interaction.reply({
          embeds: [embedBuilder.success(`Le délai avant suppression du salon a été réglé à **${delay} seconde(s)**.`)],
          ephemeral: true
        });
      }

      case 'limit': {
        const limit = interaction.options.getInteger('nombre');
        configRepository.updateGuildConfig(guildId, { max_tickets_per_category: limit });
        return interaction.reply({
          embeds: [embedBuilder.success(`La limite a été définie sur **${limit} ticket(s)** ouvert(s) par utilisateur et par catégorie.`)],
          ephemeral: true
        });
      }

      case 'cooldown': {
        const cooldownVal = interaction.options.getInteger('secondes');
        configRepository.updateGuildConfig(guildId, { cooldown_seconds: cooldownVal });
        return interaction.reply({
          embeds: [embedBuilder.success(`Le cooldown anti-spam a été défini sur **${cooldownVal} seconde(s)**.`)],
          ephemeral: true
        });
      }
    }
  }
};
