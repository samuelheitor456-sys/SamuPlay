const { Client, GatewayIntentBits } = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  entersState,
  VoiceConnectionStatus
} = require('@discordjs/voice');
const play = require('play-dl');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const queue = new Map();

client.once('ready', () => {
  console.log('🎵 SamuPlay está online!');
});

client.on('messageCreate', async (message) => {
  if (!message.content.startsWith('!') || message.author.bot) return;

  const args = message.content.slice(1).split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'play') {
    if (!message.member.voice.channel)
      return message.reply('❌ Entre em uma call primeiro!');

    const query = args.join(" ");
    if (!query)
      return message.reply('❌ Coloque o nome ou link da música.');

    try {
      const channel = message.member.voice.channel;

      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false
      });

      await entersState(connection, VoiceConnectionStatus.Ready, 30000);

      const stream = await play.stream(query);
      const resource = createAudioResource(stream.stream, {
        inputType: stream.type
      });

      const player = createAudioPlayer();

      connection.subscribe(player);
      player.play(resource);

      queue.set(message.guild.id, {
        connection,
        player
      });

      player.on(AudioPlayerStatus.Idle, () => {
        connection.destroy();
        queue.delete(message.guild.id);
      });

      message.reply('🎶 Tocando agora!');
    } catch (error) {
      console.error(error);
      message.reply('❌ Erro ao tocar música.');
    }
  }

  if (command === 'pause') {
    const serverQueue = queue.get(message.guild.id);
    if (!serverQueue) return;
    serverQueue.player.pause();
    message.reply('⏸ Música pausada.');
  }

  if (command === 'resume') {
    const serverQueue = queue.get(message.guild.id);
    if (!serverQueue) return;
    serverQueue.player.unpause();
    message.reply('▶ Música retomada.');
  }

  if (command === 'stop') {
    const serverQueue = queue.get(message.guild.id);
    if (!serverQueue) return;
    serverQueue.player.stop();
    serverQueue.connection.destroy();
    queue.delete(message.guild.id);
    message.reply('⏹ Música parada.');
  }

  if (command === 'skip') {
    const serverQueue = queue.get(message.guild.id);
    if (!serverQueue) return;
    serverQueue.player.stop();
    serverQueue.connection.destroy();
    queue.delete(message.guild.id);
    message.reply('⏭ Saindo da call.');
  }
});

client.login(process.env.TOKEN);
