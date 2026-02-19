import asyncio
import logging
import os
import uuid

from hedera import (
    Client,
    PrivateKey,
    AccountId,
    TopicCreateTransaction,
    TopicMessageSubmitTransaction,
    TokenCreateTransaction,
    TokenMintTransaction,
    TokenType,
    TokenSupplyType,
)


logger = logging.getLogger(__name__)

_fallback_sequence = 1


def _account_id_from_string(value: str) -> AccountId:
    if hasattr(AccountId, "from_string"):
        return AccountId.from_string(value)
    if hasattr(AccountId, "fromString"):
        return AccountId.fromString(value)
    raise AttributeError("AccountId parsing method not found")


def _private_key_from_string(value: str) -> PrivateKey:
    if hasattr(PrivateKey, "from_string"):
        return PrivateKey.from_string(value)
    if hasattr(PrivateKey, "fromString"):
        return PrivateKey.fromString(value)
    raise AttributeError("PrivateKey parsing method not found")


def _call_setter(obj, snake_name: str, camel_name: str, *args, **kwargs):
    method = getattr(obj, snake_name, None)
    if method is None:
        method = getattr(obj, camel_name)
    return method(*args, **kwargs)


class HederaService:
    def __init__(self):
        self.client = None
        operator_id = os.getenv("HEDERA_OPERATOR_ID")
        operator_key = os.getenv("HEDERA_OPERATOR_KEY")

        client_ctor = getattr(Client, "for_testnet", None) or getattr(Client, "forTestnet", None)

        if operator_id and operator_key and client_ctor:
            try:
                client = client_ctor()
                client.set_operator(_account_id_from_string(operator_id), _private_key_from_string(operator_key))
                self.client = client
            except Exception as exc:
                logger.warning("Failed to initialize Hedera client, falling back to stub mode: %s", exc)
        else:
            logger.info("Hedera credentials not fully provided – running in stub mode.")

    async def log_evaluation(self, evaluation: dict) -> int:
        topic_id = os.getenv("HCS_TOPIC_ID")
        message = str(evaluation)

        if not self.client or not topic_id:
            return self._fallback_sequence()

        transaction = TopicMessageSubmitTransaction()
        _call_setter(transaction, "set_topic_id", "setTopicId", topic_id)
        _call_setter(transaction, "set_message", "setMessage", message)

        tx_response = await transaction.execute_async(self.client)
        receipt = await tx_response.get_receipt_async(self.client)
        return receipt.topic_sequence_number

    async def mint_skill_token(self, user_id: str, skill_worth: int) -> str:
        token_id = os.getenv("SWT_TOKEN_ID")

        if not self.client or not token_id:
            return self._fallback_token_id()

        account_id = _account_id_from_string(user_id)

        transaction = TokenMintTransaction()
        _call_setter(transaction, "set_token_id", "setTokenId", token_id)
        _call_setter(transaction, "set_amount", "setAmount", skill_worth)

        tx_response = await transaction.execute_async(self.client)
        receipt = await tx_response.get_receipt_async(self.client)
        return str(receipt.token_id)

    async def create_skill_token(self) -> str:
        operator_id = os.getenv("HEDERA_OPERATOR_ID")
        operator_key = os.getenv("HEDERA_OPERATOR_KEY")

        if not self.client:
            return self._fallback_token_id()

        transaction = TokenCreateTransaction()
        _call_setter(transaction, "set_token_name", "setTokenName", "Skill Worth Token")
        _call_setter(transaction, "set_token_symbol", "setTokenSymbol", "SWT")
        _call_setter(transaction, "set_token_type", "setTokenType", TokenType.FUNGIBLE_COMMON)
        _call_setter(transaction, "set_decimals", "setDecimals", 2)
        _call_setter(transaction, "set_initial_supply", "setInitialSupply", 0)
        _call_setter(transaction, "set_treasury_account_id", "setTreasuryAccountId", _account_id_from_string(operator_id))
        _call_setter(transaction, "set_admin_key", "setAdminKey", _private_key_from_string(operator_key))
        _call_setter(transaction, "set_supply_key", "setSupplyKey", _private_key_from_string(operator_key))
        _call_setter(transaction, "set_supply_type", "setSupplyType", TokenSupplyType.INFINITE)

        tx_response = await transaction.execute_async(self.client)
        receipt = await tx_response.get_receipt_async(self.client)
        return str(receipt.token_id)

    def _fallback_sequence(self) -> int:
        global _fallback_sequence
        seq = _fallback_sequence
        _fallback_sequence += 1
        return seq

    def _fallback_token_id(self) -> str:
        return f"SWT-LOCAL-{uuid.uuid4().hex[:8]}"
