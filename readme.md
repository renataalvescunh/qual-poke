    # 🔴 Quem é Esse Pokémon? 🔴

Uma versão interativa e web do clássico jogo **"Quem é Esse Pokémon?"**, inspirada na Pokédex! A cada dia, um novo Pokémon é sorteado automaticamente via [PokéAPI](https://pokeapi.co/) para você adivinhar pela silhueta.

![Pokédex Daily Challenge](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png)

---

## 🎮 Como Jogar

1. **Observe a silhueta:** Todo dia à meia-noite, um novo Pokémon aparece na tela.
2. **Chute o nome:** Digite o nome do Pokémon (em português ou inglês) no campo e clique em **"Já sei!"**.
3. **Use as Dicas:** Se estiver difícil, use os botões para revelar a **Cor**, **Geração** ou **Tipo(s)** do Pokémon.
4. **Desistir / Revelar:** Não faz ideia de quem seja? Clique no botão de revelar para ver o Pokémon e tentar novamente no dia seguinte!
5. **Ofensiva (Streak):** Acerte diariamente para manter sua sequência de vitórias!

---

## 📂 Estrutura do Projeto

```text
.
├── index.html          # Interface principal da Pokédex
├── css/
│   └── style.css       # Estilos da Pokédex e animações
├── js/
│   └── script.js       # Lógica do jogo, PokéAPI e LocalStorage
└── assets/
    └── favicon.png     # Ícone do projeto