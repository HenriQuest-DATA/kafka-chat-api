import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';

dotenv.config();

const kafka = new Kafka({
  clientId: 'chat-app',
  brokers: [process.env.KAFKA_BROKERS],
});

export const producer = kafka.producer();

export const consumer = kafka.consumer({ groupId: 'chat-group' });

export const CHAT_TOPIC = 'chat-messages';

export async function initProducer() {
  await producer.connect();
  console.log('Kafka Producer conectado');
}

export async function initConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: CHAT_TOPIC, fromBeginning: false });
  console.log('Kafka Consumer conectado e inscrito no tópico');
}

export async function publishMessage(message) {
  await producer.send({
    topic: CHAT_TOPIC,
    messages: [
      {
        key: `${message.sender_id}-${message.receiver_id}`,
        value: JSON.stringify(message),
      },
    ],
  });
}