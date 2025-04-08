export interface TelegramMessageFrom {
	id: number;
	is_bot: boolean;
	first_name: string;
	last_name: string;
	language_code: string;
	username: string;
}

export interface TelegramMessage {
	date: number;
	message_id: number;
	text: string;
	from: TelegramMessageFrom;
}

export interface TelegramUpdate {
	update_id: number;
	message: TelegramMessage;
}
