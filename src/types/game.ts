/**
 * Tipagens do jogo Bastidores do Poder.
 * Nenhuma tipagem utiliza any ou unknown, seguindo estritamente a regra do projeto.
 */

export type RoleSlug =
  | 'colonel'
  | 'executor'
  | 'untouchable'
  | 'lawyer'
  | 'baron'
  | 'marketer'
  | 'investigator'
  | 'coordinator'
  | 'guide';

export interface RoleCardRuleItem {
  readonly title: string;
  readonly description: string;
  readonly type: 'action' | 'defense' | 'passive';
}

export interface RoleCard {
  readonly id: string;
  readonly slug: RoleSlug;
  readonly name: string;
  readonly category: string;
  readonly copies: string;
  readonly roleColor: string;
  readonly kind: string;
  readonly summary: string;
  readonly imageSrc: string;
  readonly imageAlt: string;
  readonly characterSrc?: string;
  readonly iconSrc?: string;
  readonly rules: readonly RoleCardRuleItem[];
  readonly officialRuleNotice: string;
}

export interface MetaStat {
  readonly value: string | number;
  readonly label: string;
}

export interface NavigationItem {
  readonly id: string;
  readonly label: string;
}

export interface GeneralAction {
  readonly name: string;
  readonly cost: string;
  readonly effect: string;
  readonly defense: string;
  readonly isAggressive?: boolean;
}

export interface TurnStep {
  readonly stepNumber: number;
  readonly title: string;
  readonly description: string;
  readonly details?: readonly string[];
}

export interface GameExample {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly highlight?: string;
}

export interface QuickReferenceRow {
  readonly action: string;
  readonly allowedBlock: string;
  readonly defender: string;
  readonly canChallengeAction: string;
}

export interface IconLegendItem {
  readonly role: string;
  readonly iconName: string;
  readonly roleColor: string;
  readonly iconSrc?: string;
}

export interface PlayerSetupCount {
  readonly players: number;
  readonly cardsPerRole: number;
  readonly totalDeckCards: number;
  readonly initialCoins: number;
}
