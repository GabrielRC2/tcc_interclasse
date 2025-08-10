#!/bin/bash

# Backup antes de começar
cp -r . ../backup-sem-conflitos

# Para cada arquivo que contenha o marcador do conflito
for file in $(grep -rl '<<<<<<< Updated upstream' .); do
  echo "Processando $file"

  # Arquivo temporário
  tmpfile="${file}.tmp"

  # Variável de controle de estado
  in_conflict=0

  # Limpa o arquivo linha a linha
  while IFS= read -r line; do
    if [[ "$line" =~ ^<<<<<<<\ Updated\ upstream ]]; then
      in_conflict=1
      continue
    elif [[ "$line" =~ ^======= ]]; then
      if [[ $in_conflict -eq 1 ]]; then
        in_conflict=2
      fi
      continue
    elif [[ "$line" =~ ^>>>>>>> ]]; then
      in_conflict=0
      continue
    fi

    if [[ $in_conflict -eq 0 || $in_conflict -eq 1 ]]; then
      echo "$line"
    fi
  done < "$file" > "$tmpfile"

  # Substitui o arquivo original
  mv "$tmpfile" "$file"
done