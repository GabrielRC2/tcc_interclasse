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
            'fk_id_players'=> 'required|integer',
            'yellow_card'=> 'nullable|integer',
            'red_card'=> 'nullable|integer',
            'fouls_amount'=> 'nullable|integer',
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
        $team = Team::findOrFail($id);
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
                'teams_group'=> 'required|string',
                'teams_name'=> 'required|string',
                'total_points'=> 'required|integer',
                'teams_gender'=> 'required|string',
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
}
