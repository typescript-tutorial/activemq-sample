export enum AckMode {
  AckAuto = 'auto',              // Client does not send ACK
  AckClient = 'client',            // Client sends ACK/NACK
  AckClientIndividual = 'client-individual' // Client sends ACK/NACK for individual messages
}
