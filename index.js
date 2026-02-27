const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const play = require('play-dl');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.once('ready', () => {
  console.log('🔥 SamuPlay está online!');
});

client.on('messageCreate', async message => {
  if (!message.content.startsWith('!') || message.author.bot) return;

  const args = message.content.slice(1).split(' ');
  const command = args.shift().toLowerCase();

  if (command === 'play') {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply("Entre em um canal de voz!");

    const search = args.join(" ");
    if (!search) return message.reply("Digite o nome da música.");

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator
    });

    const player = createAudioPlayer();
    connection.subscribe(player);

    const result = await play.search(search, { limit: 1 });
    const stream = await play.stream(result[0].url);

    const resource = createAudioResource(stream.stream, {
      inputType: stream.type
    });

    player.play(resource);

    message.reply(`🎵 Tocando: ${result[0].title}`);
  }

  if (command === 'stop') {
    message.guild.members.me.voice.disconnect();
    message.reply("⛔ Música parada.");
  }
});

client.login(process.env.TOKEN);
