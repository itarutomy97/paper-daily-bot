"""
論文収集のプリセット設定
"""

# プリセットクエリ
PRESETS = {
    # RAG関連
    "rag": "all:Retrieval-Augmented OR all:RAG OR all:'retrieval augmented'",
    "llm": "cat:cs.CL OR all:'Large Language Model' OR all:LLM",
    "agents": "all:'AI Agents' OR all:'autonomous agents' OR all:'agent systems'",
    "multimodal": "all:multimodal OR all:'vision language' OR all:VLM",

    # カテゴリベース
    "ai": "cat:cs.AI",
    "machine_learning": "cat:cs.LG",
    "computation_language": "cat:cs.CL",
    "computer_vision": "cat:cs.CV",
    "robotics": "cat:cs.RO",
    "nlp": "cat:cs.CL",

    # 組み合わせ
    "ai_ml": "cat:cs.AI OR cat:cs.LG",
    "all_ai": "cat:cs.AI OR cat:cs.LG OR cat:cs.CL OR cat:cs.CV",
}

# タイムゾーン別スケジュール例
SCHEDULES = {
    "morning": "0 0 * * *",   # 9:00 JST
    "lunch": "3 0 * * *",     # 12:00 JST
    "evening": "9 0 * * *",   # 18:00 JST
}


def get_preset_query(preset_name: str) -> str:
    """プリセット名からクエリを取得"""
    return PRESETS.get(preset_name.lower(), PRESETS["ai_ml"])
