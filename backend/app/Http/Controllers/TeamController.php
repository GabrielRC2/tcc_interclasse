<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\TeamResource;
use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TeamController extends Controller
{
    public function index(){
        return TeamResource::collection(Team::all());
    }

    public function store(Request $request){
        try {
            $validated = $request->validate([
                'teams_group'=> 'required|string',
                'teams_name'=> 'required|string',
                'teams_gender'=> 'required|string',
            ]);

            $team = Team::create($validated);
            return (new TeamResource($team))->response()->setStatusCode(201);

        } catch (ValidationException $e) {
            // Se a validação falhar, retorne os erros em JSON com status 422 Unprocessable Entity
            return response()->json([
                'message' => 'Os dados fornecidos são inválidos.',
                'errors' => $e->errors(),
            ], 422);
        }
    }

    public function show($id){
        $team = Team::with('players')->findOrFail($id);
        return new TeamResource($team);
    }

    public function destroy($id){
        $team = Team::findOrFail($id);
        $team->delete();
        return response()->json(['message' => 'Team deleted successfully'], 200);
    }

    public function update(Request $request, $id){
        try {
            $team = Team::findOrFail($id);

            // 1. Validação dos dados para atualização
            $validated = $request->validate([
                'teams_group'=> 'nullable|string',
                'teams_name'=> 'nullable|string',
                'total_points'=> 'nullable|integer',
                'teams_gender'=> 'nullable|string',
            ]);

            // 2. Atualiza o registro com os dados validados
            $team->update($validated);

            // 3. Retorna o recurso atualizado com status 200 OK
            return (new TeamResource($team))->response()->setStatusCode(200); // 200 OK

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Os dados fornecidos são inválidos.',
                'errors' => $e->errors(),
            ], 422);
        }
    }


    public function addPlayer(Request $request, $teamId){
        try {
            $team = Team::findOrFail($teamId);

            // Valida se o player_id foi fornecido e se o jogador existe
            $request->validate([
                'player_id' => 'required|integer|exists:players,id',
            ]);

            $playerId = $request->input('player_id');

            // Verifica se o jogador já está associado ao time para evitar duplicatas
            if ($team->players()->where('players.id', $playerId)->exists()) {
                return response()->json(['message' => 'Jogador já está associado a este time.'], 409); // 409 Conflict
            }

            // Anexa o jogador ao time na tabela pivô
            $team->players()->attach($playerId);

            return response()->json(['message' => 'Jogador associado ao time com sucesso!'], 200); // 200 OK
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Os dados fornecidos são inválidos.',
                'errors' => $e->errors(),
            ], 422);
        }

    }

    public function removePlayer(Request $request, $teamId)
    {
        try {
            $team = Team::findOrFail($teamId);

            // Valida se o player_id foi fornecido e se o jogador existe
            $request->validate([
                'player_id' => 'required|integer|exists:players,id',
            ]);

            $playerId = $request->input('player_id');

            // Verifica se o jogador está realmente associado ao time antes de tentar desassociar
            if (!$team->players()->where('players.id', $playerId)->exists()) {
                return response()->json(['message' => 'Jogador não está associado a este time.'], 404); // 404 Not Found
            }

            // Desanexa o jogador do time na tabela pivô
            $team->players()->detach($playerId);

            return response()->json(['message' => 'Jogador desassociado do time com sucesso!'], 200); // 200 OK
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Os dados fornecidos são inválidos.',
                'errors' => $e->errors(),
            ], 422);
        }
    }
}
