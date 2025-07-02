<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReportResource;
use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ReportController extends Controller
{
    public function index(){
        return ReportResource::collection(Report::all());
    }

    public function store(Request $request){
        try {
            $validated = $request->validate([
                'fk_id_matches'=> 'required|integer',
                'team1_points'=> 'required|integer',
                'team2_points'=> 'required|integer',
            ]);

            $report = Report::create($validated);
            return (new ReportResource($report))->response()->setStatusCode(201);

        } catch (ValidationException $e) {
            // Se a validação falhar, retorne os erros em JSON com status 422 Unprocessable Entity
            return response()->json([
                'message' => 'Os dados fornecidos são inválidos.',
                'errors' => $e->errors(),
            ], 422);
        }
    }

    public function show($id){
        $foul = Report::findOrFail($id);
        return new ReportResource($foul);
    }

    public function destroy($id){
        $report = Report::findOrFail($id);
        $report->delete();
        return response()->json(['message' => 'Foul deleted successfully'], 200);
    }

    public function update(Request $request, $id){
        try {
            $report = Report::findOrFail($id);

            // 1. Validação dos dados para atualização
            $validated = $request->validate([
                'fk_id_matches'=> 'required|integer',
                'team1_points'=> 'required|integer',
                'team2_points'=> 'required|integer',
            ]);

            // 2. Atualiza o registro com os dados validados
            $report->update($validated);

            // 3. Retorna o recurso atualizado com status 200 OK
            return (new ReportResource($report))->response()->setStatusCode(200); // 200 OK

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Os dados fornecidos são inválidos.',
                'errors' => $e->errors(),
            ], 422);
        }
    }
}
