package com.mnm.copypastabackend.api;

import com.mnm.copypastabackend.entities.Unit;
import com.mnm.copypastabackend.repositories.UnitRepository;
import io.swagger.annotations.Api;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping(path = "/units")
@Api(value = "Endpoint for interacting with units")
public class UnitEndpoint {

    @Autowired
    private UnitRepository unitRepository;

    @GetMapping("/")
    public ResponseEntity<List<Unit>> getAllUnits() {
        return ResponseEntity.ok(unitRepository.findAllByOrderByName());
    }
}
