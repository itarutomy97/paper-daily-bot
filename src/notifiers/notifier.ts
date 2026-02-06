import type { Paper } from '../types.js';

export interface Notifier {
  send(papers: Paper[]): Promise<boolean>;
}
