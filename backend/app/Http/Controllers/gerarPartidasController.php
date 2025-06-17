<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class GerarPartidasController extends Controller
{
    public function gerar(Request $request)
    {
        $grupos = $request->input('groupsData');
        if (!$grupos || !is_array($grupos)) {
            return response()->json(['error' => 'Nenhum grupo recebido.'], 400);
        }

        $todas_partidas = $this->rodizio($grupos);
        $lista_bruta = $this->achatarPartidas($todas_partidas);
        $lista_ordenada = $this->ordenarPartidasComDescanso($lista_bruta);

        return response()->json([
            'todas_partidas' => $todas_partidas,
            'lista_ordenada' => $lista_ordenada,
        ]);
    }

    // === Gerar rodízio de partidas por grupo ===
    private function rodizio($grupos)
    {
        $todas_partidas = [];

        foreach ($grupos as $grupo => $times) {
            if (count($times) % 2 == 1) {
                $times[] = "--"; // Adiciona folga se ímpar
            }

            $n = count($times);
            $num_rodadas = $n - 1;
            $jogos_por_rodada = $n / 2;

            $todas_partidas[$grupo] = [];

            for ($rodada = 0; $rodada < $num_rodadas; $rodada++) {
                $rodada_partidas = [];

                for ($i = 0; $i < $jogos_por_rodada; $i++) {
                    $time1 = $times[$i];
                    $time2 = $times[$n - 1 - $i];
                    $rodada_partidas[] = [$time1, $time2];
                }

                $todas_partidas[$grupo][] = $rodada_partidas;

                // Rotaciona os times (exceto o primeiro)
                $fixo = array_shift($times);
                $segundo = array_shift($times);
                array_push($times, $segundo);
                array_unshift($times, $fixo);
            }
        }

        return $todas_partidas;
    }

    // === Achatar as partidas em lista única ===
    private function achatarPartidas($todas_partidas)
    {
        $lista = [];
        foreach ($todas_partidas as $grupo => $rodadas) {
            foreach ($rodadas as $rodada) {
                foreach ($rodada as $jogo) {
                    if ($jogo[0] !== "--" && $jogo[1] !== "--") {
                        $lista[] = ['t1' => $jogo[0], 't2' => $jogo[1]];
                    }
                }
            }
        }
        return $lista;
    }

    // === Organizar partidas com melhor distribuição de descanso ===
    private function ordenarPartidasComDescanso($partidas)
    {
        $todas_equipes = [];
        foreach ($partidas as $jogo) {
            $todas_equipes[$jogo['t1']] = true;
            $todas_equipes[$jogo['t2']] = true;
        }
        $todas_equipes = array_keys($todas_equipes);

        $ultimaPosicao = [];
        $carga = [];
        foreach ($todas_equipes as $time) {
            $ultimaPosicao[$time] = 0;
            $carga[$time] = 0;
        }

        $remanescentes = $partidas;
        $sequencia = [];
        $pos = 1;

        while (count($remanescentes) > 0) {
            $bestIndex = null;
            $bestMinGap = -1;
            $bestSumGap = -1;
            $bestCargaSum = PHP_INT_MAX;

            foreach ($remanescentes as $idx => $jogo) {
                $t1 = $jogo['t1'];
                $t2 = $jogo['t2'];

                $gap1 = ($ultimaPosicao[$t1] === 0) ? PHP_INT_MAX : ($pos - $ultimaPosicao[$t1]);
                $gap2 = ($ultimaPosicao[$t2] === 0) ? PHP_INT_MAX : ($pos - $ultimaPosicao[$t2]);
                $minGap = min($gap1, $gap2);
                $sumGap = $gap1 + $gap2;
                $cargaSum = $carga[$t1] + $carga[$t2];

                if (
                    $bestIndex === null
                    || $minGap > $bestMinGap
                    || ($minGap === $bestMinGap && $sumGap > $bestSumGap)
                    || ($minGap === $bestMinGap && $sumGap === $bestSumGap && $cargaSum < $bestCargaSum)
                ) {
                    $bestIndex = $idx;
                    $bestMinGap = $minGap;
                    $bestSumGap = $sumGap;
                    $bestCargaSum = $cargaSum;
                }
            }

            $jogoEscolhido = $remanescentes[$bestIndex];
            unset($remanescentes[$bestIndex]);
            $remanescentes = array_values($remanescentes);

            $t1 = $jogoEscolhido['t1'];
            $t2 = $jogoEscolhido['t2'];

            $gap1Atual = ($ultimaPosicao[$t1] === 0) ? PHP_INT_MAX : ($pos - $ultimaPosicao[$t1]);
            $gap2Atual = ($ultimaPosicao[$t2] === 0) ? PHP_INT_MAX : ($pos - $ultimaPosicao[$t2]);

            if ($gap1Atual <= 1) {
                $carga[$t1]++;
            }
            if ($gap2Atual <= 1) {
                $carga[$t2]++;
            }

            $ultimaPosicao[$t1] = $pos;
            $ultimaPosicao[$t2] = $pos;

            $sequencia[] = $jogoEscolhido;
            $pos++;
        }

        return $sequencia;
    }
}